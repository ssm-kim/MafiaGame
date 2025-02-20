export default function getRandomRole() {
  const korRoles = ['마피아', '경찰', '의사', '시민'];
  const roles = ['PLAGUE_DOCTOR', 'CITIZEN', 'ZOMBIE', 'POLICE'];

  const randomIndex = Math.floor(Math.random() * roles.length);
  return korRoles[randomIndex];
}
