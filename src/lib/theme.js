export const provinceColors = {
  江苏: "#667f62",
  北京: "#4b7297",
  陕西: "#c66b4c",
  湖北: "#6c91ad",
  天津: "#97a9b7",
  河北: "#8b9987",
  山东: "#c89951",
  四川: "#5f87a5",
  湖南: "#8c7c9f",
  江西: "#689078",
  海南: "#5c9296",
  安徽: "#d59b87",
  浙江: "#91a48e",
};

export const avatarToneClasses = ["olive", "sand", "blue", "clay", "sage", "rose"];

export function colorForProvince(province) {
  return provinceColors[province] ?? "#68736e";
}

export function avatarTone(name) {
  const hash = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  return avatarToneClasses[hash % avatarToneClasses.length];
}
