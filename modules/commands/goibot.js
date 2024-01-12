const axios = require('axios');
const fs = require("fs-extra");
const stringSimilarity = require('string-similarity');

class Module {
    constructor() {
        this.dataThread = null;
        this.dataFilePath = __dirname + "/cache/simsim/data.json";
    }

    async onLoad({ models }) {
        if (!fs.existsSync(__dirname + "/cache/simsim")) {
            fs.mkdirSync(__dirname + "/cache/simsim", { recursive: true });
        }
        if (!fs.existsSync(this.dataFilePath)) {
            fs.writeFileSync(this.dataFilePath, JSON.stringify({}));
        }
        this.dataThread = JSON.parse(fs.readFileSync(this.dataFilePath));
        const Threads = models.use('Threads');
        const data = await Threads.findAll();
        data.forEach(({ threadID }) => {
            if (!(threadID in this.dataThread)) {
                this.dataThread[threadID] = false;
                console.log(`Tìm thấy thread mới: ${threadID}`);
            }
        });
        fs.writeFileSync(this.dataFilePath, JSON.stringify(this.dataThread, null, 2));
    }

    run({ api, event }) {
        const threadID = event.threadID;
        const isBotResponseEnabled = this.dataThread[threadID] || false;
        const newBotResponseEnabled = !isBotResponseEnabled;
        this.dataThread[threadID] = newBotResponseEnabled;
        try {
            fs.writeFileSync(this.dataFilePath, JSON.stringify(this.dataThread, null, 2));
        } catch (error) {
            console.log("Không thể ghi tệp dữ liệu: ", error);
        }
        const message = newBotResponseEnabled ? "bật" : "tắt";
        api.sendMessage(`Đã ${message} thành công bot trả lời khi gọi!`, threadID, (error, info) => {
            if (error) {
                console.log("Gửi tin nhắn thất bại: ", error);
            }
        });
    }

    getAskedResponse(text) {
        const formData = new URLSearchParams();
        formData.append('text', text);
        formData.append('lc', 'vn');
        return axios.post('https://simsimi.vn/web/simtalk', formData)
            .then(({ data }) => data.success)
            .catch(err => Promise.reject(err));
    }

    async handleEvent({ api, event }) {
        const { usages, answer } = this.config;
        const userInput = event.body.toLowerCase();

        const bestMatch = stringSimilarity.findBestMatch(userInput, usages);
        const similarityRatio = bestMatch.bestMatch.rating;

        if (event.senderID !== api.getCurrentUserID() && similarityRatio >= 0.9 && this.dataThread[event.threadID]) {
            const randomAnswer = answer[Math.floor(Math.random() * answer.length)];
            return api.sendMessage(
                randomAnswer,
                event.threadID,
                async (err, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        type: "reply"
                    });
                },
                event.messageID
            );
        }
    }

    async handleReply({ api, event, handleReply }) {
        switch (handleReply.type) {
            case "reply": {
                const response = await this.getAskedResponse(event.body);
                return api.sendMessage(
                    response,
                    event.threadID,
                    (err, info) => {
                        global.client.handleReply.push({
                            name: this.config.name,
                            messageID: info.messageID,
                            type: "reply"
                        });
                    },
                    event.messageID
                );
            }
        }
    }

    get config() {
        return {
            name: "goibot",
            description: "Bot sẽ trả lời khi bạn gọi!",
            version: "1.0.0",
            credits: 'Thiệu Trung Kiên',
            hasPermssion: 2,
            commandCategory: "Tự động",
            usages: ["bot ơi", "ơi bot", "bot đẹp","bot","ê bot","bot đâu rồi"],
            answer: ["Bot nghe!", "Ơi em đây!!","ơiiiii"],
            cooldowns: 5
        };
    }
}

module.exports = new Module();