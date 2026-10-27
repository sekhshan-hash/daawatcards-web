export const MEALS = ["none", "breakfast", "brunch", "lunch", "hightea", "snacks", "supper", "dinner", "hightea_dinner", "custom"];

export const mealName = (ev, t) => {
  if (ev.meal === "custom") return ev.meal_custom?.trim() || "";
  return ev.meal && ev.meal !== "none" ? t(`meals.${ev.meal}`) : "";
};

// Empty when no meal is chosen; the host's own line wins over the default "{meal} to follow".
export const mealLine = (ev, t) => {
  const name = mealName(ev, t);
  return name ? ev.meal_line?.trim() || t("guest.mealLine", { meal: name }) : "";
};
