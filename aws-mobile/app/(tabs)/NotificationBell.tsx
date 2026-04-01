import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import authApiService from "../../services/authService";
import notificationService, {
	type NotificationItem,
	type NotificationLevel,
	type NotificationPage,
	type NotificationSourceType,
} from "../../services/notificationService";

const SOURCE_TYPES: { label: string; value: NotificationSourceType | null }[] = [
	{ label: "All", value: null },
	{ label: "Order", value: "ORDER" },
	{ label: "Schedule", value: "SCHEDULE" },
	{ label: "Line", value: "LINE" },
	{ label: "Account", value: "ACCOUNT" },
	{ label: "KPI", value: "KPI" },
	{ label: "Quality", value: "QUALITY" },
	{ label: "Report", value: "REPORT" },
	{ label: "Machine", value: "MACHINE" },
];

const PAGE_SIZE = 20;

const SOURCE_ICON_BY_TYPE: Record<string, keyof typeof Ionicons.glyphMap> = {
	ORDER: "cube-outline",
	SCHEDULE: "calendar-outline",
	LINE: "business-outline",
	ACCOUNT: "person-outline",
	KPI: "stats-chart-outline",
	QUALITY: "flask-outline",
	REPORT: "clipboard-outline",
	MACHINE: "build-outline",
};

const SOURCE_LABELS = SOURCE_TYPES.reduce<Record<string, string>>((acc, item) => {
	if (item.value) {
		acc[item.value] = item.label;
	}
	return acc;
}, {});

const getRoleDefaultPath = (_role?: string): "/(tabs)/LeaderProgress" => {
	const normalized = (_role || "").toUpperCase();
	if (normalized === "LINE_LEADER") {
		return "/(tabs)/LeaderProgress";
	}
	if (normalized === "ADMIN") {
		return "/(tabs)/LeaderProgress";
	}
	if (normalized === "MANAGER" || normalized === "PRODUCTION_PLANNER") {
		return "/(tabs)/LeaderProgress";
	}
	return "/(tabs)/LeaderProgress";
};

const normalizeNotificationUrl = (
	_notif: NotificationItem,
	role?: string,
): "/(tabs)/LeaderProgress" => {
	return getRoleDefaultPath(role);
};

const getLevelColor = (level?: NotificationLevel) => {
	if (level === "WARN") {
		return "#D97706";
	}
	if (level === "ERROR") {
		return "#DC2626";
	}
	return "#0284C7";
};

const timeAgo = (dateStr?: string) => {
	if (!dateStr) {
		return "";
	}

	const now = new Date();
	const date = new Date(dateStr);
	const diffMs = now.getTime() - date.getTime();
	const diffMin = Math.floor(diffMs / 60000);

	if (diffMin < 1) {
		return "Just now";
	}
	if (diffMin < 60) {
		return `${diffMin}m ago`;
	}

	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) {
		return `${diffHr}h ago`;
	}

	const diffDay = Math.floor(diffHr / 24);
	if (diffDay < 7) {
		return `${diffDay}d ago`;
	}

	return date.toLocaleDateString();
};

const stripHtml = (html?: string) => {
	if (!html) {
		return "";
	}
	return html.replace(/<[^>]*>/g, "").trim();
};

const getMessageFromError = (error: unknown) => {
	const anyError = error as {
		response?: { data?: { message?: string } | string };
		message?: string;
	};

	const responseData = anyError?.response?.data;
	if (typeof responseData === "string" && responseData.trim()) {
		return responseData;
	}
	if (typeof responseData === "object" && responseData?.message) {
		return responseData.message;
	}
	return anyError?.message || "Something went wrong";
};

export default function NotificationBell() {
	const router = useRouter();

	const [unreadCount, setUnreadCount] = useState(0);
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [activeFilter, setActiveFilter] = useState<NotificationSourceType | null>(null);
	const [loadError, setLoadError] = useState("");
	const [resolvedUserId, setResolvedUserId] = useState<number | null>(null);
	const [userRole, setUserRole] = useState("");
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const userIdCandidates = useMemo(() => {
		return [resolvedUserId].filter((value): value is number => Number.isFinite(value));
	}, [resolvedUserId]);

	useEffect(() => {
		const initUser = async () => {
			const user = await authApiService.getCurrentUser();
			const ids = [user?.userId, user?.id]
				.map((value) => Number(value))
				.filter((value, index, arr) => Number.isFinite(value) && value > 0 && arr.indexOf(value) === index);

			setResolvedUserId(ids[0] ?? null);
			setUserRole(String(user?.role || ""));
		};

		initUser();
	}, []);

	const resolveUserIdForNotifications = useCallback(async () => {
		if (resolvedUserId) {
			return resolvedUserId;
		}

		const user = await authApiService.getCurrentUser();
		const ids = [user?.userId, user?.id]
			.map((value) => Number(value))
			.filter((value, index, arr) => Number.isFinite(value) && value > 0 && arr.indexOf(value) === index);

		const chosen = ids[0] ?? null;
		if (chosen) {
			setResolvedUserId(chosen);
			setUserRole(String(user?.role || ""));
		}
		return chosen;
	}, [resolvedUserId]);

	const fetchUnreadCount = useCallback(async () => {
		const baseUserId = await resolveUserIdForNotifications();
		if (!baseUserId) {
			return;
		}

		const tryIds = [baseUserId, ...userIdCandidates.filter((id) => id !== baseUserId)];

		for (const candidateId of tryIds) {
			try {
				const count = await notificationService.getUnreadCount(candidateId);
				setUnreadCount(count);
				if (resolvedUserId !== candidateId) {
					setResolvedUserId(candidateId);
				}
				return;
			} catch {
				// Try next ID
			}
		}
	}, [resolveUserIdForNotifications, userIdCandidates, resolvedUserId]);

	const fetchNotifications = useCallback(
		async (pageNum = 0, filter = activeFilter, append = false) => {
			const baseUserId = await resolveUserIdForNotifications();
			if (!baseUserId) {
				return;
			}

			const tryIds = [baseUserId, ...userIdCandidates.filter((id) => id !== baseUserId)];

			setLoading(true);
			if (!append) {
				setLoadError("");
			}

			try {
				let selectedData: NotificationPage | null = null;
				let selectedUserId: number | null = null;

				for (const candidateId of tryIds) {
					try {
						const data = filter
							? await notificationService.getFilteredNotifications(
									candidateId,
									filter,
									pageNum,
									PAGE_SIZE,
								)
							: await notificationService.getNotifications(candidateId, pageNum, PAGE_SIZE);

						const hasResults = (data.totalElements ?? 0) > 0 || data.content.length > 0;
						if (!selectedData || hasResults || candidateId === baseUserId) {
							selectedData = data;
							selectedUserId = candidateId;
						}

						if (hasResults) {
							break;
						}
					} catch {
						// Try next ID.
					}
				}

				if (!selectedData) {
					throw new Error("Unable to load notifications for current session user");
				}

				if (selectedUserId && resolvedUserId !== selectedUserId) {
					setResolvedUserId(selectedUserId);
				}

				setNotifications((prev) => (append ? [...prev, ...selectedData.content] : selectedData.content));
				setPage(selectedData.number ?? pageNum);
				setTotalPages(selectedData.totalPages ?? 1);
			} catch (error) {
				setLoadError(getMessageFromError(error));
			} finally {
				setLoading(false);
			}
		},
		[activeFilter, resolveUserIdForNotifications, userIdCandidates, resolvedUserId],
	);

	useEffect(() => {
		fetchUnreadCount();
		intervalRef.current = setInterval(fetchUnreadCount, 30000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [fetchUnreadCount]);

	useEffect(() => {
		if (!resolvedUserId) {
			return;
		}

		setPage(0);
		fetchNotifications(0, activeFilter, false);
	}, [activeFilter, fetchNotifications, resolvedUserId]);

	const handleFilterChange = (sourceType: NotificationSourceType | null) => {
		setActiveFilter(sourceType);
		setPage(0);
		setNotifications([]);
		setLoadError("");
	};

	const handleMarkAsRead = async (notif: NotificationItem) => {
		const userId = await resolveUserIdForNotifications();
		if (!userId || notif.status === "READ") {
			return;
		}

		try {
			await notificationService.markAsRead(notif.id, userId);
			setNotifications((prev) =>
				prev.map((item) => (item.id === notif.id ? { ...item, status: "READ" } : item)),
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
			setLoadError("");
		} catch (error) {
			setLoadError(getMessageFromError(error));
		}
	};

	const handleMarkAllAsRead = async () => {
		const userId = await resolveUserIdForNotifications();
		if (!userId) {
			return;
		}

		try {
			await notificationService.markAllAsRead(userId);
			setNotifications((prev) => prev.map((item) => ({ ...item, status: "READ" })));
			setUnreadCount(0);
			setLoadError("");
		} catch (error) {
			setLoadError(getMessageFromError(error));
		}
	};

	const handleLoadMore = () => {
		if (loading || page + 1 >= totalPages) {
			return;
		}
		fetchNotifications(page + 1, activeFilter, true);
	};

	const handleItemClick = async (notif: NotificationItem) => {
		await handleMarkAsRead(notif);
		const nextPath = normalizeNotificationUrl(notif, userRole);
		router.push(nextPath);
	};

	return (
		<View style={styles.wrapper}>
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Text style={styles.title}>Notifications</Text>
					<Text style={styles.subtitle}>
						{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
					</Text>
				</View>

				<View style={styles.headerActions}>
					<Pressable
						onPress={handleMarkAllAsRead}
						disabled={unreadCount === 0}
						style={[styles.markAllButton, unreadCount === 0 && styles.disabledButton]}
					>
						<Text style={styles.markAllText}>Mark all</Text>
					</Pressable>
				</View>
			</View>

			<View style={styles.filterBar}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={styles.filters}
					contentContainerStyle={styles.filtersContent}
				>
					{SOURCE_TYPES.map((item) => {
						const active = activeFilter === item.value;
						return (
							<Pressable
								key={item.label}
								style={[styles.filterChip, active && styles.filterChipActive]}
								onPress={() => handleFilterChange(item.value)}
							>
								<Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
									{item.label}
								</Text>
							</Pressable>
						);
					})}
				</ScrollView>
			</View>

			{loadError ? (
				<View style={styles.errorRow}>
					<Text style={styles.errorText}>{loadError}</Text>
					<Pressable onPress={() => fetchNotifications(0, activeFilter, false)}>
						<Text style={styles.retryText}>Retry</Text>
					</Pressable>
				</View>
			) : null}

			<ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
							{loading && notifications.length === 0 ? (
								<View style={styles.centeredBlock}>
									<ActivityIndicator size="small" color="#2C6E8A" />
								</View>
							) : notifications.length === 0 ? (
								<View style={styles.centeredBlock}>
									<Ionicons name="notifications-off-outline" size={24} color="#94A3B8" />
									<Text style={styles.emptyText}>No notifications</Text>
								</View>
							) : (
								notifications.map((notif) => {
									const level = (notif.level || "INFO").toUpperCase() as NotificationLevel;
									const sourceType = (notif.sourceType || "").toUpperCase();
									const icon = SOURCE_ICON_BY_TYPE[sourceType] || "notifications-outline";

									return (
										<Pressable
											key={String(notif.id)}
											style={[styles.item, notif.status === "UNREAD" && styles.unreadItem]}
											onPress={() => handleItemClick(notif)}
										>
											<View style={[styles.itemIcon, { backgroundColor: `${getLevelColor(level)}22` }]}>
												<Ionicons name={icon} size={16} color={getLevelColor(level)} />
											</View>

											<View style={styles.itemBody}>
												<Text style={styles.itemTitle}>{notif.title || "Notification"}</Text>
												<Text numberOfLines={2} style={styles.itemMessage}>
													{stripHtml(notif.message)}
												</Text>
												<View style={styles.itemMeta}>
													<Text style={styles.itemTime}>{timeAgo(notif.createdAt)}</Text>
													<Text style={styles.itemSource}>
														{SOURCE_LABELS[sourceType] || notif.sourceType || "General"}
													</Text>
												</View>
											</View>

											{notif.status === "UNREAD" ? <View style={styles.unreadDot} /> : null}
										</Pressable>
									);
								})
							)}
			</ScrollView>

			{page + 1 < totalPages ? (
				<View style={styles.loadMoreRow}>
					<Pressable style={styles.loadMoreButton} onPress={handleLoadMore} disabled={loading}>
						<Text style={styles.loadMoreText}>{loading ? "Loading..." : "Load more"}</Text>
					</Pressable>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: "#F8FAFC",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: "#F1F5F9",
		backgroundColor: "#FFFFFF",
	},
	headerLeft: {
		flex: 1,
		gap: 2,
	},
	headerActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	title: {
		fontSize: 16,
		fontWeight: "800",
		color: "#0F172A",
	},
	subtitle: {
		fontSize: 12,
		fontWeight: "600",
		color: "#64748B",
	},
	markAllButton: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: "#E2F3FB",
	},
	markAllText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#0369A1",
	},
	disabledButton: {
		opacity: 0.45,
	},
	filterBar: {
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E8EEF5",
	},
	filters: {
		backgroundColor: "#FFFFFF",
	},
	filtersContent: {
		paddingVertical: 8,
		paddingRight: 12,
		alignItems: "center",
	},
	filterChip: {
		marginLeft: 10,
		marginVertical: 0,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#D5E2EE",
	},
	filterChipActive: {
		backgroundColor: "#155E75",
		borderColor: "#155E75",
	},
	filterChipText: {
		fontSize: 11,
		fontWeight: "600",
		color: "#334155",
	},
	filterChipTextActive: {
		color: "#FFFFFF",
	},
	errorRow: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		backgroundColor: "#FEF2F2",
		borderBottomWidth: 1,
		borderBottomColor: "#FECACA",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 10,
	},
	errorText: {
		flex: 1,
		fontSize: 12,
		color: "#B91C1C",
		fontWeight: "600",
	},
	retryText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#991B1B",
	},
	list: {
		flex: 1,
	},
	listContent: {
		flexGrow: 1,
		paddingHorizontal: 10,
		paddingVertical: 10,
		gap: 8,
	},
	centeredBlock: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	emptyText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#64748B",
	},
	item: {
		flexDirection: "row",
		gap: 10,
		paddingHorizontal: 12,
		paddingVertical: 11,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#E7EEF5",
		backgroundColor: "#FFFFFF",
	},
	unreadItem: {
		backgroundColor: "#F0F9FF",
		borderColor: "#BFDBFE",
	},
	itemIcon: {
		width: 34,
		height: 34,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	itemBody: {
		flex: 1,
		gap: 3,
	},
	itemTitle: {
		fontSize: 13,
		color: "#0F172A",
		fontWeight: "700",
	},
	itemMessage: {
		fontSize: 12,
		color: "#475569",
		lineHeight: 17,
	},
	itemMeta: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 8,
		marginTop: 1,
	},
	itemTime: {
		fontSize: 11,
		color: "#94A3B8",
	},
	itemSource: {
		fontSize: 10,
		fontWeight: "700",
		color: "#155E75",
		backgroundColor: "#DFF7FF",
		borderRadius: 999,
		paddingHorizontal: 7,
		paddingVertical: 2,
		overflow: "hidden",
	},
	unreadDot: {
		width: 8,
		height: 8,
		borderRadius: 999,
		backgroundColor: "#14B8A6",
		marginTop: 6,
	},
	loadMoreRow: {
		paddingVertical: 12,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F8FAFC",
		borderTopWidth: 1,
		borderTopColor: "#E8EEF5",
	},
	loadMoreButton: {
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 999,
		backgroundColor: "#E0F2FE",
	},
	loadMoreText: {
		fontSize: 13,
		color: "#0369A1",
		fontWeight: "700",
	},
});
