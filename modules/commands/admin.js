module.exports.config = {
  name: "admin",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Vtuan",
  description: "Hiển thị thông tin của các admin",
  commandCategory: "Thành Viên",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const adminIDs = global.config.ADMINBOT;
  let msg = "[ Danh Sách Admin ]\n";
  for (let i = 0; i < adminIDs.length; i++) {
    const adminID = adminIDs[i];
    if (!adminID) {
      msg += `${i + 1}.Không có thông tin admin!\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n`;
      continue;
    }
      const userInfo = await api.getUserInfo(adminID);
      const userName = userInfo[adminID].name;
      msg += `${i + 1}.admin: ${userName}\n`;
      msg += `‣link fb: https://www.facebook.com/${adminID}\n`;
      msg += `\n▱▱▱▱▱▱▱▱▱▱▱▱▱\n`;
  }
  msg += `[ ! ] - Nếu cần hỗ trợ hãy ib 1 trong số các admin hoặc sử dụng callad để được hỗ trợ!`
  api.sendMessage(msg || 'Không có thông tin admin.', event.threadID, event.messageID);
};