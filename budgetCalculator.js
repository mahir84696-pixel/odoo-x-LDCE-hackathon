function calculateBudget(expenses = {}, tripBudget = 0) {
  const transport = Number(expenses.transport || 0);
  const stay = Number(expenses.stay || 0);
  const activities = Number(expenses.activities || 0);
  const food = Number(expenses.food || 0);
  const misc = Number(expenses.misc || 0);
  const total = transport + stay + activities + food + misc;
  return {
    transport,
    stay,
    activities,
    food,
    misc,
    total,
    remaining: Number(tripBudget || 0) - total
  };
}

function activitySpend(stops = []) {
  return stops.reduce((sum, stop) => {
    const stopActs = (stop.activities || []).reduce((s, a) => s + Number(a.cost || 0), 0);
    return sum + stopActs + Number(stop.budget || 0);
  }, 0);
}

module.exports = { calculateBudget, activitySpend };
