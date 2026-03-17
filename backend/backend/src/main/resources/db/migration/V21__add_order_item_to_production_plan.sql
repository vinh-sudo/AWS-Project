ALTER TABLE production_plan
ADD COLUMN order_item_id INTEGER;

ALTER TABLE production_plan
ADD CONSTRAINT fk_production_plan_order_item
FOREIGN KEY (order_item_id)
REFERENCES order_items(item_id);

