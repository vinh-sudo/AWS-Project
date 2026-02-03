ALTER TABLE production_plan
    DROP COLUMN estimated_machines;

-- Tìm plan theo order (Manager, confirm, cancel, history)
CREATE INDEX IF NOT EXISTS idx_plan_order_id
    ON production_plan(order_id);

-- Tìm plan theo line (capacity, Gantt, overview)
CREATE INDEX IF NOT EXISTS idx_plan_line_id
    ON production_plan(line_id);

-- DRAFT / CONFIRMED / CANCELLED filter
CREATE INDEX IF NOT EXISTS idx_plan_decision
    ON production_plan(decision);

-- Phục vụ findByOrderIdAndDecision
CREATE INDEX IF NOT EXISTS idx_plan_order_decision
    ON production_plan(order_id, decision);

-- Manager tạo plan
CREATE INDEX IF NOT EXISTS idx_plan_created_by
    ON production_plan(created_by);

-- Gantt & timeline
CREATE INDEX IF NOT EXISTS idx_plan_date
    ON production_plan(planned_start_date, planned_end_date);


-- production_schedule no longer has line_id
DROP INDEX IF EXISTS idx_schedule_line_id;

-- production_schedule no longer has leader_id
DROP INDEX IF EXISTS idx_schedule_leader_id;

-----------------------------
-- 2. ADD NEW CORRECT INDEXES
-----------------------------

-- Schedule now links to Machine
CREATE INDEX IF NOT EXISTS idx_schedule_machine_id
    ON production_schedule(machine_id);

-- Schedule now links to Plan
CREATE INDEX IF NOT EXISTS idx_schedule_plan_id
    ON production_schedule(plan_id);

-- Fast time queries (Gantt / overlap)
CREATE INDEX IF NOT EXISTS idx_schedule_time
    ON production_schedule(start_time, end_time);

-----------------------------
-- 3. Line Leader Assignment indexes
-----------------------------

CREATE INDEX IF NOT EXISTS idx_assignment_line_id
    ON line_leader_assignment(line_id);

CREATE INDEX IF NOT EXISTS idx_assignment_leader_id
    ON line_leader_assignment(leader_id);

-- Active leader per line (soft constraint via query)
CREATE INDEX IF NOT EXISTS idx_assignment_active_line
    ON line_leader_assignment(line_id)
    WHERE end_date IS NULL;

-----------------------------
-- 4. Machine performance
-----------------------------

CREATE INDEX IF NOT EXISTS idx_machine_code
    ON machine(machine_code);
