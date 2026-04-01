import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Linking,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	useWindowDimensions,
	View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import useAuth from "@/hooks/useAuth";
import leaderService, {
	type LeaderDashboardResponse,
	type ScheduleSummaryResponse,
} from "@/services/leaderService";

type ScheduleStatus = "SCHEDULED" | "RUNNING" | "PAUSED" | "COMPLETED";
type Shift = "MORNING" | "AFTERNOON" | "NIGHT";
type Severity = "LOW" | "MEDIUM" | "HIGH";
type TabKey = "inProgress" | "scheduled" | "onHold";

type ScheduleDocument = {
	id?: string;
	label: string;
	link?: string;
};

type ScheduleItem = {
	scheduleId: string;
	orderInfo: string;
	status: ScheduleStatus;
	startTime?: string;
	endTime?: string;
	percentage?: number;
	orderCompletionPercentage?: number;
	orderItemCompletionPercentage?: number;
	targetQuantity: number;
	previousStageGoodQuantity?: number;
	documents: ScheduleDocument[];
};

type DashboardState = {
	lineName?: string;
	todayProducedQuantity: number;
	todayDowntimeMinutes: number;
	todayEfficiency: number;
	activeScheduleCount: number;
	unresolvedIncidentCount: number;
	recentIncidents: {
		incidentId: string;
		incidentType: string;
		severity?: Severity;
		timestamp?: string;
	}[];
};

type ShiftReportForm = {
	scheduleId: string;
	shift: Shift;
	targetQuantity: number;
	goodQuantity: number;
	rejectQuantity: number;
	downtimeMinutes: number;
	notes: string;
};

const SHIFT_REPORT_DRAFT_KEY = "leader_shift_report_draft_v1";

const INCIDENT_TYPES = [
	"MACHINE_FAILURE",
	"MATERIAL_SHORTAGE",
	"QUALITY_ISSUE",
	"SAFETY_INCIDENT",
	"LABOR_SHORTAGE",
	"OTHER",
] as const;

const INCIDENT_TYPE_LABELS: Record<(typeof INCIDENT_TYPES)[number], string> = {
	MACHINE_FAILURE: "Machine Failure",
	MATERIAL_SHORTAGE: "Material Shortage",
	QUALITY_ISSUE: "Quality Issue",
	SAFETY_INCIDENT: "Safety Incident",
	LABOR_SHORTAGE: "Labor Shortage",
	OTHER: "Other",
};

const createDefaultShiftReport = (scheduleId = ""): ShiftReportForm => ({
	scheduleId,
	shift: "MORNING",
	targetQuantity: 0,
	goodQuantity: 0,
	rejectQuantity: 0,
	downtimeMinutes: 0,
	notes: "",
});

const getNumberValue = (...values: unknown[]) => {
	for (const value of values) {
		const num = Number(value);
		if (Number.isFinite(num) && num >= 0) {
			return num;
		}
	}
	return null;
};

const parseDocuments = (documents: ScheduleSummaryResponse["documents"]) => {
	if (!Array.isArray(documents)) {
		return [] as ScheduleDocument[];
	}

	const result: ScheduleDocument[] = [];

	documents.forEach((doc, index) => {
		if (typeof doc === "string") {
			result.push({
				id: `doc-${index}-${doc}`,
				label: doc,
			});
			return;
		}

		if (!doc) {
			return;
		}

		result.push({
			id: doc.id != null ? String(doc.id) : `doc-${index}`,
			label: doc.fileName || doc.documentName || "Document",
			link: doc.url || doc.fileUrl || doc.downloadUrl,
		});
	});

	return result;
};

const mapApiSchedule = (schedule: ScheduleSummaryResponse): ScheduleItem => {
	const targetQuantity =
		getNumberValue(
			schedule.targetQuantity,
			schedule.targetQty,
			schedule.plannedQty,
			schedule.plannedQuantity,
			schedule.planQty,
			schedule.quantity,
			schedule.orderQuantity,
			schedule.requiredQuantity,
			schedule.totalQuantity,
			schedule.orderItemQuantity,
			schedule.orderItem?.plannedQty,
			schedule.orderItem?.quantity,
			schedule.orderItem?.targetQuantity,
		) ?? 0;

	const previousStageGoodQuantity = getNumberValue(
		schedule.previousStageGoodQuantity,
		schedule.previousGoodQuantity,
		schedule.prevStageGoodQty,
	);

	return {
		scheduleId: String(schedule.scheduleId),
		orderInfo: schedule.orderInfo || "N/A",
		status: schedule.status,
		startTime: schedule.startTime,
		endTime: schedule.endTime,
		percentage:
			schedule.percentage != null ? Number(schedule.percentage) : undefined,
		orderCompletionPercentage:
			schedule.orderCompletionPercentage != null
				? Number(schedule.orderCompletionPercentage)
				: undefined,
		orderItemCompletionPercentage:
			schedule.orderItemCompletionPercentage != null
				? Number(schedule.orderItemCompletionPercentage)
				: undefined,
		targetQuantity,
		previousStageGoodQuantity:
			previousStageGoodQuantity != null
				? Number(previousStageGoodQuantity)
				: undefined,
		documents: parseDocuments(schedule.documents),
	};
};

const mapDashboard = (dashboard: LeaderDashboardResponse): DashboardState => ({
	lineName: dashboard.lineName,
	todayProducedQuantity: Number(dashboard.todayProducedQuantity || 0),
	todayDowntimeMinutes: Number(dashboard.todayDowntimeMinutes || 0),
	todayEfficiency: Number(dashboard.todayEfficiency || 0),
	activeScheduleCount: Number(dashboard.activeScheduleCount || 0),
	unresolvedIncidentCount: Number(dashboard.unresolvedIncidentCount || 0),
	recentIncidents: Array.isArray(dashboard.recentIncidents)
		? dashboard.recentIncidents.map((item, index) => ({
				incidentId: String(item.incidentId ?? `${index}`),
				incidentType: String(item.incidentType ?? "OTHER"),
				severity: item.severity,
				timestamp: item.timestamp,
			}))
		: [],
});

const statusLabel = (status: ScheduleStatus) => {
	switch (status) {
		case "SCHEDULED":
			return "Scheduled";
		case "RUNNING":
			return "Running";
		case "PAUSED":
			return "Paused";
		case "COMPLETED":
			return "Completed";
		default:
			return status;
	}
};

const statusColor = (status: ScheduleStatus) => {
	switch (status) {
		case "RUNNING":
			return "#059669";
		case "SCHEDULED":
			return "#2563EB";
		case "PAUSED":
			return "#D97706";
		case "COMPLETED":
			return "#16A34A";
		default:
			return "#64748B";
	}
};

const getErrorMessage = (error: any) => {
	const status = error?.response?.status;
	const message = error?.response?.data?.message || "";

	if (status === 404 && String(message).toLowerCase().includes("assignment")) {
		return "NOT_ASSIGNED";
	}
	if (status === 404) {
		return "NOT_ASSIGNED";
	}
	if (status === 403) {
		return "You do not have permission to access this page.";
	}
	if (status === 401) {
		return "Session expired. Please log in again.";
	}
	if (status === 500) {
		return message || "Server error occurred. Please try again later.";
	}
	return message || "Unable to load data. Please try again.";
};

const getApiErrorMessage = (error: any, fallback: string) => {
	const responseData = error?.response?.data;
	const messageFromObject =
		typeof responseData === "object"
			? responseData?.message || responseData?.error || responseData?.detail
			: null;
	const messageFromString =
		typeof responseData === "string" ? responseData : null;

	return messageFromObject || messageFromString || error?.message || fallback;
};

export default function LeaderProgressScreen() {
	const { user } = useAuth();
	const { width } = useWindowDimensions();
	const isCompactScreen = width < 380;
	const horizontalPadding = width < 360 ? 12 : 16;

	const [activeTab, setActiveTab] = useState<TabKey>("inProgress");
	const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
	const [dashboard, setDashboard] = useState<DashboardState | null>(null);
	const [isFetching, setIsFetching] = useState(true);
	const [fetchError, setFetchError] = useState<string | null>(null);

	const [showIncidentModal, setShowIncidentModal] = useState(false);
	const [showReportModal, setShowReportModal] = useState(false);
	const [showDocumentModal, setShowDocumentModal] = useState(false);
	const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
	const [selectedDocuments, setSelectedDocuments] = useState<ScheduleDocument[]>([]);

	const [scheduleDocuments, setScheduleDocuments] = useState<Record<string, ScheduleDocument[]>>({});
	const [localProgressBySchedule, setLocalProgressBySchedule] = useState<Record<string, number>>({});
	const [localOrderItemProgressBySchedule, setLocalOrderItemProgressBySchedule] = useState<Record<string, number>>({});

	const [incidentType, setIncidentType] = useState<(typeof INCIDENT_TYPES)[number]>("MACHINE_FAILURE");
	const [incidentSeverity, setIncidentSeverity] = useState<Severity>("MEDIUM");
	const [incidentDescription, setIncidentDescription] = useState("");

	const [shiftReport, setShiftReport] = useState<ShiftReportForm>(createDefaultShiftReport());

	useEffect(() => {
		const loadDraft = async () => {
			try {
				const raw = await AsyncStorage.getItem(SHIFT_REPORT_DRAFT_KEY);
				if (!raw) {
					return;
				}

				const parsed = JSON.parse(raw) as Partial<ShiftReportForm>;
				setShiftReport({
					...createDefaultShiftReport(),
					...parsed,
				});
			} catch {
				setShiftReport(createDefaultShiftReport());
			}
		};

		loadDraft();
	}, []);

	useEffect(() => {
		if (!showReportModal) {
			return;
		}

		AsyncStorage.setItem(SHIFT_REPORT_DRAFT_KEY, JSON.stringify(shiftReport)).catch(() => {});
	}, [shiftReport, showReportModal]);

	const fetchData = useCallback(async () => {
		setIsFetching(true);
		setFetchError(null);

		try {
			const [dashboardRes, schedulesRes] = await Promise.allSettled([
				leaderService.getDashboard(),
				leaderService.getMySchedules(),
			]);

			setDashboard(
				dashboardRes.status === "fulfilled" ? mapDashboard(dashboardRes.value) : null,
			);
			setSchedules(
				schedulesRes.status === "fulfilled"
					? schedulesRes.value.map(mapApiSchedule)
					: [],
			);

			const dashboardRejected = dashboardRes.status === "rejected";
			const schedulesRejected = schedulesRes.status === "rejected";

			if (dashboardRejected || schedulesRejected) {
				const priorityReason = schedulesRejected
					? (schedulesRes as PromiseRejectedResult).reason
					: (dashboardRes as PromiseRejectedResult).reason;
				const errorMsg = getErrorMessage(priorityReason);

				setFetchError(errorMsg === "NOT_ASSIGNED" ? "NOT_ASSIGNED" : errorMsg);
			}
		} catch (error: any) {
			setFetchError(getErrorMessage(error));
		} finally {
			setIsFetching(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const filteredSchedules = useMemo(() => {
		if (activeTab === "inProgress") {
			return schedules.filter((schedule) => schedule.status === "RUNNING");
		}
		if (activeTab === "scheduled") {
			return schedules.filter((schedule) => schedule.status === "SCHEDULED");
		}
		return schedules.filter((schedule) => schedule.status === "PAUSED");
	}, [activeTab, schedules]);

	const summary = useMemo(() => {
		return {
			todayProduced: dashboard?.todayProducedQuantity ?? 0,
			activeCount: dashboard?.activeScheduleCount ?? 0,
			downtime: dashboard?.todayDowntimeMinutes ?? 0,
			efficiency: dashboard?.todayEfficiency ?? 0,
			scheduled: schedules.filter((schedule) => schedule.status === "SCHEDULED").length,
			inProgress: schedules.filter((schedule) => schedule.status === "RUNNING").length,
			onHold: schedules.filter((schedule) => schedule.status === "PAUSED").length,
		};
	}, [dashboard, schedules]);

	const openIncidentModal = (schedule: ScheduleItem) => {
		setSelectedSchedule(schedule);
		setIncidentType("MACHINE_FAILURE");
		setIncidentSeverity("MEDIUM");
		setIncidentDescription("");
		setShowIncidentModal(true);
	};

	const openReportModal = (schedule: ScheduleItem | null = null) => {
		setShiftReport((prev) => {
			if (!schedule?.scheduleId) {
				return prev;
			}

			const next = {
				...prev,
				scheduleId: String(schedule.scheduleId),
				targetQuantity: schedule.targetQuantity,
			};

			return next;
		});

		setSelectedSchedule(schedule);
		setShowReportModal(true);
	};

	const openDocumentModal = (schedule: ScheduleItem) => {
		const fromSchedule = schedule.documents || [];
		const fromStart = scheduleDocuments[schedule.scheduleId] || [];
		const docs = fromSchedule.length > 0 ? fromSchedule : fromStart;

		setSelectedSchedule(schedule);
		setSelectedDocuments(docs);
		setShowDocumentModal(true);
	};

	const handleStartSchedule = async (schedule: ScheduleItem) => {
		try {
			const result = await leaderService.startSchedule(schedule.scheduleId);

			if (Array.isArray(result?.documents) && result.documents.length > 0) {
				setScheduleDocuments((prev) => ({
					...prev,
					[schedule.scheduleId]: parseDocuments(result.documents),
				}));
			}

			Alert.alert("Success", "Production started.");
			await fetchData();
		} catch (error: any) {
			Alert.alert("Start failed", error?.response?.data?.message || "Unable to start schedule.");
		}
	};

	const handleResumeSchedule = async (scheduleId: string) => {
		try {
			await leaderService.resumeSchedule(scheduleId);
			Alert.alert("Success", "Schedule resumed.");
			await fetchData();
		} catch (error: any) {
			Alert.alert("Resume failed", error?.response?.data?.message || "Unable to resume schedule.");
		}
	};

	const submitIncident = async () => {
		if (!selectedSchedule || !incidentDescription.trim()) {
			return;
		}

		try {
			await leaderService.reportIncident({
				scheduleId: selectedSchedule.scheduleId,
				machineId: null,
				incidentType,
				severity: incidentSeverity,
				description: incidentDescription.trim(),
			});

			setShowIncidentModal(false);
			Alert.alert("Success", "Incident submitted.");
			await fetchData();
		} catch (error: any) {
			Alert.alert("Submit failed", getApiErrorMessage(error, "Unable to submit incident."));
		}
	};

	const submitShiftReport = async () => {
		try {
			if (fetchError) {
				Alert.alert("Blocked", "Cannot submit while schedule data failed to load.");
				return;
			}

			const chosenSchedule = schedules.find(
				(item) => String(item.scheduleId) === String(shiftReport.scheduleId),
			);

			if (!chosenSchedule) {
				Alert.alert("Invalid schedule", "Please reload and choose a valid schedule.");
				return;
			}

			if (!["RUNNING", "PAUSED"].includes(chosenSchedule.status)) {
				Alert.alert("Invalid status", "Report can only be submitted for RUNNING or PAUSED schedules.");
				return;
			}

			const payload = {
				// Backend may return numeric or non-numeric IDs; only cast when safe.
				scheduleId: /^\d+$/.test(String(shiftReport.scheduleId).trim())
					? Number(shiftReport.scheduleId)
					: String(shiftReport.scheduleId).trim(),
				shift: shiftReport.shift,
				targetQuantity: Math.max(0, Number(shiftReport.targetQuantity) || 0),
				goodQuantity: Math.max(0, Number(shiftReport.goodQuantity) || 0),
				rejectQuantity: Math.max(0, Number(shiftReport.rejectQuantity) || 0),
				downtimeMinutes: Math.max(0, Number(shiftReport.downtimeMinutes) || 0),
				notes: shiftReport.notes.trim() || undefined,
			};

			if (payload.targetQuantity <= 0) {
				Alert.alert("Invalid input", "Target quantity must be greater than 0.");
				return;
			}

			if (payload.goodQuantity + payload.rejectQuantity > payload.targetQuantity) {
				Alert.alert("Invalid input", "Good + Reject cannot exceed Target quantity.");
				return;
			}

			const result = await leaderService.submitReport(payload);

			if (result?.scheduleId && result?.scheduleCompletionPercentage != null) {
				setLocalProgressBySchedule((prev) => ({
					...prev,
					[String(result.scheduleId)]: Number(result.scheduleCompletionPercentage),
				}));
			}

			if (result?.scheduleId && result?.orderItemCompletionPercentage != null) {
				setLocalOrderItemProgressBySchedule((prev) => ({
					...prev,
					[String(result.scheduleId)]: Number(result.orderItemCompletionPercentage),
				}));
			}

			setShowReportModal(false);
			setSelectedSchedule(null);
			setShiftReport(createDefaultShiftReport());
			await AsyncStorage.removeItem(SHIFT_REPORT_DRAFT_KEY);

			Alert.alert("Success", result?.message || "Shift report submitted.");
			await fetchData();
		} catch (error: any) {
			Alert.alert("Submit failed", getApiErrorMessage(error, "Unable to submit report."));
		}
	};

	const getScheduleProgressValue = (schedule: ScheduleItem) => {
		if (Object.prototype.hasOwnProperty.call(localProgressBySchedule, schedule.scheduleId)) {
			return localProgressBySchedule[schedule.scheduleId];
		}
		if (schedule.percentage != null) {
			return Number(schedule.percentage);
		}
		return null;
	};

	const getOrderItemProgressValue = (schedule: ScheduleItem) => {
		if (
			Object.prototype.hasOwnProperty.call(
				localOrderItemProgressBySchedule,
				schedule.scheduleId,
			)
		) {
			return localOrderItemProgressBySchedule[schedule.scheduleId];
		}

		if (schedule.orderItemCompletionPercentage != null) {
			return Number(schedule.orderItemCompletionPercentage);
		}

		return null;
	};

	const runningOrPausedSchedules = schedules.filter((item) =>
		["RUNNING", "PAUSED"].includes(item.status),
	);

	return (
		<View style={styles.page}>
			<ScrollView
				contentContainerStyle={[
					styles.content,
					{ paddingHorizontal: horizontalPadding },
				]}
			>
				<View style={styles.headerRow}>
					<View style={styles.heroTitleWrap}>
						<Text style={[styles.heroTitle, isCompactScreen && styles.heroTitleCompact]}>
							Production Health
						</Text>
						<Text style={styles.heroMeta}>
							Leader: {user?.fullName ?? "Leader"} | {dashboard?.lineName || "Line"}
						</Text>
					</View>
					<View style={styles.headerRight}>
						{(dashboard?.unresolvedIncidentCount ?? 0) > 0 ? (
							<View style={styles.incidentBadge}>
								<Text style={styles.incidentBadgeCount}>
									{dashboard?.unresolvedIncidentCount ?? 0}
								</Text>
								<Text style={styles.incidentBadgeText}>Open Incidents</Text>
							</View>
						) : null}
					</View>
				</View>

				{isFetching ? (
					<View style={styles.loadingWrap}>
						<ActivityIndicator size="small" color="#2563EB" />
						<Text style={styles.loadingText}>Loading schedules...</Text>
					</View>
				) : null}

				{fetchError === "NOT_ASSIGNED" ? (
					<View style={styles.notAssignedCard}>
						<Text style={styles.notAssignedTitle}>Not Assigned to a Production Line</Text>
						<Text style={styles.notAssignedText}>
							Your account has not been assigned to any production line. Please contact manager.
						</Text>
						<Text style={styles.notAssignedMeta}>Name: {user?.fullName || "Leader"}</Text>
						<Text style={styles.notAssignedMeta}>Employee ID: {user?.employeeCode || "N/A"}</Text>
						<Pressable style={styles.retryButton} onPress={fetchData}>
							<Text style={styles.retryButtonText}>Check Again</Text>
						</Pressable>
					</View>
				) : null}

				{fetchError && fetchError !== "NOT_ASSIGNED" ? (
					<View style={styles.errorBanner}>
						<Text style={styles.errorBannerText}>{fetchError}</Text>
						<Pressable style={styles.retryButton} onPress={fetchData}>
							<Text style={styles.retryButtonText}>Retry</Text>
						</Pressable>
					</View>
				) : null}

				<View style={styles.summaryGrid}>
					<View
						style={[
							styles.summaryCard,
							isCompactScreen ? styles.summaryCardSingleColumn : styles.summaryCardTwoColumns,
							styles.summaryCardCyan,
						]}
					>
						<Text style={styles.summaryValue}>{summary.todayProduced}</Text>
						<Text style={styles.summaryLabel}>Today Output</Text>
					</View>
					<View
						style={[
							styles.summaryCard,
							isCompactScreen ? styles.summaryCardSingleColumn : styles.summaryCardTwoColumns,
							styles.summaryCardBlue,
						]}
					>
						<Text style={styles.summaryValue}>{summary.activeCount}</Text>
						<Text style={styles.summaryLabel}>Active</Text>
					</View>
					<View
						style={[
							styles.summaryCard,
							isCompactScreen ? styles.summaryCardSingleColumn : styles.summaryCardTwoColumns,
							styles.summaryCardAmber,
						]}
					>
						<Text style={styles.summaryValue}>{summary.downtime}m</Text>
						<Text style={styles.summaryLabel}>Downtime</Text>
					</View>
					<View
						style={[
							styles.summaryCard,
							isCompactScreen ? styles.summaryCardSingleColumn : styles.summaryCardTwoColumns,
							styles.summaryCardEmerald,
						]}
					>
						<Text style={styles.summaryValue}>{summary.efficiency}%</Text>
						<Text style={styles.summaryLabel}>Efficiency</Text>
					</View>
				</View>

				<View style={styles.chipRow}>
					<Pressable
						style={[styles.chip, activeTab === "inProgress" && styles.chipActive]}
						onPress={() => setActiveTab("inProgress")}
					>
						<Text style={[styles.chipText, activeTab === "inProgress" && styles.chipTextActive]}>
							In Production ({summary.inProgress})
						</Text>
					</Pressable>
					<Pressable
						style={[styles.chip, activeTab === "scheduled" && styles.chipActive]}
						onPress={() => setActiveTab("scheduled")}
					>
						<Text style={[styles.chipText, activeTab === "scheduled" && styles.chipTextActive]}>
							Scheduled ({summary.scheduled})
						</Text>
					</Pressable>
					<Pressable
						style={[styles.chip, activeTab === "onHold" && styles.chipActive]}
						onPress={() => setActiveTab("onHold")}
					>
						<Text style={[styles.chipText, activeTab === "onHold" && styles.chipTextActive]}>
							Paused ({summary.onHold})
						</Text>
					</Pressable>
				</View>

				{!isFetching && !fetchError && filteredSchedules.length === 0 ? (
					<View style={styles.emptyState}>
						<Text style={styles.emptyStateText}>No schedules found for this filter.</Text>
					</View>
				) : null}

				{filteredSchedules.map((schedule) => {
					const scheduleProgress = getScheduleProgressValue(schedule);
					const orderProgress = schedule.orderCompletionPercentage ?? null;
					const orderItemProgress = getOrderItemProgressValue(schedule);

					return (
						<View key={schedule.scheduleId} style={styles.card}>
							<View style={styles.cardHeader}>
								<Text style={styles.cardTitle}>SCH-{schedule.scheduleId}</Text>
								<View style={[styles.statusBadge, { borderColor: statusColor(schedule.status) }]}>
									<Text style={[styles.statusText, { color: statusColor(schedule.status) }]}>
										{statusLabel(schedule.status)}
									</Text>
								</View>
							</View>

							<Text style={styles.orderInfo}>{schedule.orderInfo}</Text>

							<Text style={styles.metaText}>
								Start: {schedule.startTime ? new Date(schedule.startTime).toLocaleString("en-US") : "-"}
							</Text>
							<Text style={styles.metaText}>
								End: {schedule.endTime ? new Date(schedule.endTime).toLocaleString("en-US") : "-"}
							</Text>
							<Text style={styles.metaText}>Target Quantity: {schedule.targetQuantity}</Text>
							{schedule.previousStageGoodQuantity != null ? (
								<Text style={styles.metaText}>
									Previous Stage Good: {schedule.previousStageGoodQuantity}
								</Text>
							) : null}
							{scheduleProgress != null ? (
								<Text style={styles.progressText}>Progress: {scheduleProgress}%</Text>
							) : null}
							{orderProgress != null ? (
								<Text style={styles.progressText}>Order Completion: {orderProgress}%</Text>
							) : null}
							{orderItemProgress != null ? (
								<Text style={styles.progressText}>Item Completion: {orderItemProgress}%</Text>
							) : null}

							<View style={styles.actionRow}>
								{schedule.status === "SCHEDULED" ? (
									<Pressable
										style={[styles.actionBtn, styles.actionSuccess]}
										onPress={() => handleStartSchedule(schedule)}
									>
										<Text style={styles.actionSuccessText}>Start Production</Text>
									</Pressable>
								) : null}

								{schedule.status === "RUNNING" ? (
									<>
										<Pressable
											style={[styles.actionBtn, styles.actionPrimary]}
											onPress={() => openReportModal(schedule)}
										>
											<Text style={styles.actionPrimaryText}>Log Output</Text>
										</Pressable>

										{(schedule.documents.length > 0 ||
											(scheduleDocuments[schedule.scheduleId] || []).length > 0) ? (
											<Pressable
												style={[styles.actionBtn, styles.actionOutline]}
												onPress={() => openDocumentModal(schedule)}
											>
												<Text style={styles.actionOutlineText}>Documents</Text>
											</Pressable>
										) : null}

										<Pressable
											style={[styles.actionBtn, styles.actionDanger]}
											onPress={() => openIncidentModal(schedule)}
										>
											<Text style={styles.actionDangerText}>Incident</Text>
										</Pressable>
									</>
								) : null}

								{schedule.status === "PAUSED" ? (
									<>
										<Pressable
											style={[styles.actionBtn, styles.actionSuccess]}
											onPress={() => handleResumeSchedule(schedule.scheduleId)}
										>
											<Text style={styles.actionSuccessText}>Resume</Text>
										</Pressable>

										{(schedule.documents.length > 0 ||
											(scheduleDocuments[schedule.scheduleId] || []).length > 0) ? (
											<Pressable
												style={[styles.actionBtn, styles.actionOutline]}
												onPress={() => openDocumentModal(schedule)}
											>
												<Text style={styles.actionOutlineText}>Documents</Text>
											</Pressable>
										) : null}

										<Pressable
											style={[styles.actionBtn, styles.actionPrimary]}
											onPress={() => openReportModal(schedule)}
										>
											<Text style={styles.actionPrimaryText}>Log Shift Output</Text>
										</Pressable>

										<Pressable
											style={[styles.actionBtn, styles.actionDanger]}
											onPress={() => openIncidentModal(schedule)}
										>
											<Text style={styles.actionDangerText}>Incident</Text>
										</Pressable>
									</>
								) : null}

								{schedule.status === "COMPLETED" ? (
									<View style={styles.completedBadge}>
										<Text style={styles.completedBadgeText}>Completed</Text>
									</View>
								) : null}
							</View>
						</View>
					);
				})}

				{!isFetching &&
				(dashboard?.unresolvedIncidentCount ?? 0) > 0 &&
				(dashboard?.recentIncidents?.length ?? 0) === 0 ? (
					<View style={styles.errorBanner}>
						<Text style={styles.errorBannerText}>
							There are {dashboard?.unresolvedIncidentCount ?? 0} open incidents. Backend currently returns count only.
						</Text>
					</View>
				) : null}

				{(dashboard?.recentIncidents?.length ?? 0) > 0 ? (
					<View style={styles.incidentSection}>
						<Text style={styles.incidentTitle}>
							Recent Incidents ({dashboard?.recentIncidents?.length ?? 0})
						</Text>
						{dashboard?.recentIncidents?.map((incident) => (
							<View key={incident.incidentId} style={styles.incidentCard}>
								<Text style={styles.incidentText}>
									{INCIDENT_TYPE_LABELS[incident.incidentType as (typeof INCIDENT_TYPES)[number]] ||
										incident.incidentType}
								</Text>
								<Text style={styles.incidentSubText}>Severity: {incident.severity || "N/A"}</Text>
								<Text style={styles.incidentSubText}>
									{incident.timestamp
										? new Date(incident.timestamp).toLocaleString("en-US")
										: "-"}
								</Text>
							</View>
						))}
					</View>
				) : null}
			</ScrollView>

			<Modal visible={showIncidentModal} transparent animationType="fade" onRequestClose={() => setShowIncidentModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Report Incident</Text>
						<Text style={styles.modalHint}>Schedule: SCH-{selectedSchedule?.scheduleId}</Text>

						<Text style={styles.inputLabel}>Type</Text>
						<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inlineScroll}>
							{INCIDENT_TYPES.map((type) => (
								<Pressable
									key={type}
									style={[styles.optionChip, incidentType === type && styles.optionChipActive]}
									onPress={() => setIncidentType(type)}
								>
									<Text style={[styles.optionChipText, incidentType === type && styles.optionChipTextActive]}>
										{INCIDENT_TYPE_LABELS[type]}
									</Text>
								</Pressable>
							))}
						</ScrollView>

						<Text style={styles.inputLabel}>Severity</Text>
						<View style={styles.inlineRow}>
							{(["LOW", "MEDIUM", "HIGH"] as Severity[]).map((value) => (
								<Pressable
									key={value}
									style={[styles.optionChip, incidentSeverity === value && styles.optionChipActive]}
									onPress={() => setIncidentSeverity(value)}
								>
									<Text style={[styles.optionChipText, incidentSeverity === value && styles.optionChipTextActive]}>
										{value}
									</Text>
								</Pressable>
							))}
						</View>

						<Text style={styles.inputLabel}>Description</Text>
						<TextInput
							style={styles.textArea}
							multiline
							placeholder="Describe the incident..."
							value={incidentDescription}
							onChangeText={setIncidentDescription}
						/>

						<View style={styles.modalActions}>
							<Pressable style={styles.modalCancel} onPress={() => setShowIncidentModal(false)}>
								<Text style={styles.modalCancelText}>Cancel</Text>
							</Pressable>
							<Pressable
								style={[styles.modalConfirm, !incidentDescription.trim() && styles.disabledButton]}
								onPress={submitIncident}
								disabled={!incidentDescription.trim()}
							>
								<Text style={styles.modalConfirmText}>Submit</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>

			<Modal visible={showReportModal} transparent animationType="fade" onRequestClose={() => setShowReportModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Shift Output Report</Text>

						<Text style={styles.inputLabel}>Schedule</Text>
						<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inlineScroll}>
							{runningOrPausedSchedules.map((schedule) => (
								<Pressable
									key={schedule.scheduleId}
									style={[
										styles.optionChip,
										shiftReport.scheduleId === schedule.scheduleId && styles.optionChipActive,
									]}
									onPress={() => {
										setShiftReport((prev) => ({
											...prev,
											scheduleId: schedule.scheduleId,
											targetQuantity: schedule.targetQuantity,
										}));
										setSelectedSchedule(schedule);
									}}
								>
									<Text
										style={[
											styles.optionChipText,
											shiftReport.scheduleId === schedule.scheduleId && styles.optionChipTextActive,
										]}
									>
										SCH-{schedule.scheduleId}
									</Text>
								</Pressable>
							))}
						</ScrollView>

						<Text style={styles.modalHint}>Draft is auto-saved while you type.</Text>

						<Text style={styles.inputLabel}>Shift</Text>
						<View style={styles.inlineRow}>
							{(["MORNING", "AFTERNOON", "NIGHT"] as Shift[]).map((value) => (
								<Pressable
									key={value}
									style={[styles.optionChip, shiftReport.shift === value && styles.optionChipActive]}
									onPress={() => setShiftReport((prev) => ({ ...prev, shift: value }))}
								>
									<Text style={[styles.optionChipText, shiftReport.shift === value && styles.optionChipTextActive]}>
										{value}
									</Text>
								</Pressable>
							))}
						</View>

						<View style={styles.doubleInputRow}>
							<View style={styles.inputWrap}>
								<Text style={styles.inputLabel}>Target</Text>
								<TextInput
									value={String(shiftReport.targetQuantity)}
									onChangeText={(value) =>
										setShiftReport((prev) => ({
											...prev,
											targetQuantity: Math.max(0, parseInt(value, 10) || 0),
										}))
									}
									keyboardType="number-pad"
									style={styles.input}
								/>
							</View>
							<View style={styles.inputWrap}>
								<Text style={styles.inputLabel}>Good</Text>
								<TextInput
									value={String(shiftReport.goodQuantity)}
									onChangeText={(value) =>
										setShiftReport((prev) => ({
											...prev,
											goodQuantity: Math.max(0, parseInt(value, 10) || 0),
										}))
									}
									keyboardType="number-pad"
									style={styles.input}
								/>
							</View>
						</View>

						<View style={styles.doubleInputRow}>
							<View style={styles.inputWrap}>
								<Text style={styles.inputLabel}>Reject</Text>
								<TextInput
									value={String(shiftReport.rejectQuantity)}
									onChangeText={(value) =>
										setShiftReport((prev) => ({
											...prev,
											rejectQuantity: Math.max(0, parseInt(value, 10) || 0),
										}))
									}
									keyboardType="number-pad"
									style={styles.input}
								/>
							</View>
							<View style={styles.inputWrap}>
								<Text style={styles.inputLabel}>Downtime (m)</Text>
								<TextInput
									value={String(shiftReport.downtimeMinutes)}
									onChangeText={(value) =>
										setShiftReport((prev) => ({
											...prev,
											downtimeMinutes: Math.max(0, parseInt(value, 10) || 0),
										}))
									}
									keyboardType="number-pad"
									style={styles.input}
								/>
							</View>
						</View>

						<Text style={styles.inputLabel}>Notes</Text>
						<TextInput
							style={styles.textArea}
							multiline
							placeholder="Additional notes..."
							value={shiftReport.notes}
							onChangeText={(value) => setShiftReport((prev) => ({ ...prev, notes: value }))}
						/>

						<View style={styles.modalActions}>
							<Pressable style={styles.modalCancel} onPress={() => setShowReportModal(false)}>
								<Text style={styles.modalCancelText}>Cancel</Text>
							</Pressable>
							<Pressable
								style={[
									styles.modalConfirm,
									(!shiftReport.scheduleId || !!fetchError) && styles.disabledButton,
								]}
								onPress={submitShiftReport}
								disabled={!shiftReport.scheduleId || !!fetchError}
							>
								<Text style={styles.modalConfirmText}>Submit</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>

			<Modal visible={showDocumentModal} transparent animationType="fade" onRequestClose={() => setShowDocumentModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Production Documents</Text>
						<Text style={styles.modalHint}>Schedule: SCH-{selectedSchedule?.scheduleId}</Text>

						{selectedDocuments.length ? (
							selectedDocuments.map((doc) => (
								<Pressable
									key={doc.id || doc.label}
									style={styles.docItem}
									onPress={() => {
										if (!doc.link) {
											return;
										}
										Linking.openURL(doc.link).catch(() => {
											Alert.alert("Open failed", "Cannot open this document link.");
										});
									}}
								>
									<Ionicons name="document-text-outline" size={18} color="#2563EB" />
									<View style={styles.docTextWrap}>
										<Text style={styles.docText}>{doc.label}</Text>
										<Text style={styles.docSubText}>{doc.link ? "Tap to open" : "No link available"}</Text>
									</View>
								</Pressable>
							))
						) : (
							<Text style={styles.emptyText}>No documents available.</Text>
						)}

						<View style={styles.modalActions}>
							<Pressable style={styles.modalConfirm} onPress={() => setShowDocumentModal(false)}>
								<Text style={styles.modalConfirmText}>Close</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>

		</View>
	);
}

const styles = StyleSheet.create({
	page: {
		flex: 1,
		backgroundColor: "#F8FAFC",
	},
	content: {
		paddingTop: 18,
		gap: 12,
		paddingBottom: 110,
	},
	headerRow: {
		borderRadius: 24,
		paddingHorizontal: 18,
		paddingVertical: 22,
		backgroundColor: "#EDEFF5",
		gap: 14,
	},
	heroTitleWrap: {
		alignItems: "center",
		gap: 6,
	},
	heroTitle: {
		fontSize: 40,
		lineHeight: 44,
		fontWeight: "900",
		color: "#0B1020",
		textAlign: "center",
		letterSpacing: -1,
	},
	heroMeta: {
		fontSize: 13,
		fontWeight: "600",
		color: "#6B7280",
		textAlign: "center",
	},
	headerRight: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		flexWrap: "wrap",
		justifyContent: "center",
		width: "100%",
		minHeight: 34,
	},
	incidentBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 999,
		backgroundColor: "#FEF2F2",
		borderWidth: 1,
		borderColor: "#FECACA",
		maxWidth: "100%",
	},
	incidentBadgeCount: {
		color: "#FFFFFF",
		fontSize: 11,
		fontWeight: "800",
		backgroundColor: "#DC2626",
		borderRadius: 999,
		paddingVertical: 1,
		paddingHorizontal: 7,
	},
	incidentBadgeText: {
		color: "#B91C1C",
		fontSize: 12,
		fontWeight: "700",
	},
	heroTitleCompact: {
		fontSize: 32,
		lineHeight: 36,
	},
	loadingWrap: {
		marginTop: 8,
		marginBottom: 4,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	loadingText: {
		color: "#475569",
		fontSize: 12,
		fontWeight: "600",
	},
	errorBanner: {
		marginTop: 8,
		marginBottom: 4,
		borderWidth: 1,
		borderColor: "#FECACA",
		backgroundColor: "#FEF2F2",
		borderRadius: 10,
		padding: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 8,
	},
	errorBannerText: {
		flex: 1,
		color: "#991B1B",
		fontSize: 12,
		fontWeight: "600",
	},
	notAssignedCard: {
		marginTop: 8,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#E2E8F0",
		backgroundColor: "#FFFFFF",
		padding: 14,
		gap: 8,
	},
	notAssignedTitle: {
		fontSize: 14,
		fontWeight: "800",
		color: "#0F172A",
	},
	notAssignedText: {
		fontSize: 12,
		color: "#475569",
	},
	notAssignedMeta: {
		fontSize: 12,
		color: "#334155",
		fontWeight: "600",
	},
	retryButton: {
		backgroundColor: "#DC2626",
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	retryButtonText: {
		color: "#FFFFFF",
		fontSize: 12,
		fontWeight: "700",
	},
	summaryGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	summaryCard: {
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 140,
		backgroundColor: "#FFFFFF",
		borderColor: "#F1F5F9",
		borderWidth: 1,
		borderRadius: 12,
		padding: 14,
	},
	summaryCardTwoColumns: {
		flexBasis: "48%",
	},
	summaryCardSingleColumn: {
		flexBasis: "100%",
	},
	summaryCardCyan: {
		borderLeftWidth: 3,
		borderLeftColor: "#6366F1",
	},
	summaryCardBlue: {
		borderLeftWidth: 3,
		borderLeftColor: "#2563EB",
	},
	summaryCardAmber: {
		borderLeftWidth: 3,
		borderLeftColor: "#D97706",
	},
	summaryCardEmerald: {
		borderLeftWidth: 3,
		borderLeftColor: "#059669",
	},
	summaryValue: {
		fontSize: 22,
		fontWeight: "800",
		color: "#111827",
	},
	summaryLabel: {
		marginTop: 2,
		fontSize: 12,
		color: "#64748B",
	},
	chipRow: {
		flexDirection: "row",
		gap: 8,
		flexWrap: "wrap",
	},
	chip: {
		borderWidth: 1,
		borderColor: "#CBD5E1",
		backgroundColor: "#FFFFFF",
		borderRadius: 999,
		paddingHorizontal: 14,
		paddingVertical: 7,
	},
	chipActive: {
		backgroundColor: "#6366F1",
		borderColor: "#6366F1",
	},
	chipText: {
		color: "#334155",
		fontWeight: "600",
		fontSize: 12,
	},
	chipTextActive: {
		color: "#FFFFFF",
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#F1F5F9",
		borderRadius: 12,
		padding: 16,
		gap: 7,
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	cardTitle: {
		fontSize: 14,
		fontWeight: "800",
		color: "#1E293B",
	},
	statusBadge: {
		borderWidth: 1,
		borderRadius: 999,
		paddingHorizontal: 11,
		paddingVertical: 4,
		backgroundColor: "#F8FAFC",
	},
	statusText: {
		fontSize: 11,
		fontWeight: "700",
	},
	orderInfo: {
		fontSize: 14,
		fontWeight: "600",
		color: "#0F172A",
	},
	metaText: {
		fontSize: 12,
		color: "#475569",
	},
	progressText: {
		fontSize: 12,
		color: "#1D4ED8",
		fontWeight: "700",
	},
	actionRow: {
		marginTop: 8,
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
	},
	actionBtn: {
		borderRadius: 8,
		paddingVertical: 7,
		paddingHorizontal: 12,
		borderWidth: 1,
		maxWidth: "100%",
	},
	actionPrimary: {
		backgroundColor: "#EEF2FF",
		borderColor: "#C7D2FE",
	},
	actionPrimaryText: {
		color: "#4338CA",
		fontWeight: "700",
		fontSize: 12,
	},
	actionOutline: {
		backgroundColor: "#F8FAFC",
		borderColor: "#CBD5E1",
	},
	actionOutlineText: {
		color: "#334155",
		fontWeight: "700",
		fontSize: 12,
	},
	actionDanger: {
		backgroundColor: "#FEF2F2",
		borderColor: "#FECACA",
	},
	actionDangerText: {
		color: "#B91C1C",
		fontWeight: "700",
		fontSize: 12,
	},
	actionSuccess: {
		backgroundColor: "#ECFDF5",
		borderColor: "#A7F3D0",
	},
	actionSuccessText: {
		color: "#047857",
		fontWeight: "700",
		fontSize: 12,
	},
	completedBadge: {
		backgroundColor: "#ECFDF5",
		borderColor: "#86EFAC",
		borderWidth: 1,
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	completedBadgeText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#166534",
	},
	incidentSection: {
		marginTop: 8,
		gap: 8,
	},
	incidentTitle: {
		fontSize: 14,
		fontWeight: "800",
		color: "#0F172A",
	},
	incidentCard: {
		backgroundColor: "#FEF2F2",
		borderColor: "#FECACA",
		borderWidth: 1,
		borderRadius: 10,
		padding: 10,
		gap: 4,
	},
	incidentText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#7F1D1D",
	},
	incidentSubText: {
		fontSize: 12,
		color: "#991B1B",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(15, 23, 42, 0.45)",
		justifyContent: "center",
		padding: 16,
	},
	modalCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#F1F5F9",
		padding: 16,
		gap: 8,
		maxHeight: "90%",
	},
	modalTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#0F172A",
	},
	modalHint: {
		fontSize: 12,
		color: "#64748B",
		marginBottom: 4,
	},
	inputLabel: {
		fontSize: 12,
		fontWeight: "700",
		color: "#334155",
		marginTop: 4,
	},
	input: {
		borderWidth: 1,
		borderColor: "#CBD5E1",
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 8,
		fontSize: 14,
	},
	textArea: {
		borderWidth: 1,
		borderColor: "#CBD5E1",
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		minHeight: 90,
		fontSize: 14,
		textAlignVertical: "top",
	},
	inlineRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
	},
	inlineScroll: {
		maxHeight: 40,
	},
	optionChip: {
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "#CBD5E1",
		backgroundColor: "#FFFFFF",
		paddingHorizontal: 10,
		paddingVertical: 7,
		marginRight: 6,
	},
	optionChipActive: {
		backgroundColor: "#4F46E5",
		borderColor: "#4F46E5",
	},
	optionChipText: {
		fontSize: 11,
		fontWeight: "700",
		color: "#334155",
	},
	optionChipTextActive: {
		color: "#FFFFFF",
	},
	doubleInputRow: {
		flexDirection: "row",
		gap: 8,
	},
	inputWrap: {
		flex: 1,
		gap: 4,
	},
	modalActions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 8,
		marginTop: 8,
	},
	modalCancel: {
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#CBD5E1",
		paddingVertical: 9,
		paddingHorizontal: 14,
		backgroundColor: "#FFFFFF",
	},
	modalCancelText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#334155",
	},
	modalConfirm: {
		borderRadius: 10,
		paddingVertical: 9,
		paddingHorizontal: 14,
		backgroundColor: "#6366F1",
	},
	modalConfirmText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	disabledButton: {
		opacity: 0.45,
	},
	docItem: {
		borderWidth: 1,
		borderColor: "#E2E8F0",
		borderRadius: 10,
		padding: 10,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	docTextWrap: {
		flex: 1,
		gap: 2,
	},
	docText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#1E293B",
	},
	docSubText: {
		fontSize: 12,
		color: "#64748B",
	},
	emptyText: {
		color: "#64748B",
		fontSize: 13,
	},
	emptyState: {
		marginTop: 8,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E2E8F0",
		borderRadius: 12,
		padding: 14,
		alignItems: "center",
	},
	emptyStateText: {
		color: "#64748B",
		fontSize: 13,
		fontWeight: "600",
	},
});
