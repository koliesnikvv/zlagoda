// role = "Manager" | "Cashier"
export const getUserRoleLabel = (role) => {
  console.log("Mapping role:", role);
  const roles = {
    Manager: "Менеджер",
    Cashier: "Касир",
  };

  return roles[role] || roles.Cashier;
};
