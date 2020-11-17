var { Client, MessageMedia } = require("whatsapp-web.js");
const svgToImg = require("svg-to-img");
var fs = require("fs");
var https = require("https");
const Viz = require("viz.js");
const { Module, render } = require("viz.js/full.render.js");

let viz = new Viz({ Module, render });
var SESSION_FILE_PATH = "./session.json";
let sessionCfg;

var regParser = require("automata.js");

// var parser = new regParser.RegParser("a*b");
// var nfa = parser.parseToNFA();

// console.log(nfa.toDotScript());

if (fs.existsSync(SESSION_FILE_PATH)) {
  //mengecek apakah udah ada session yang tersimpan
  sessionCfg = require(SESSION_FILE_PATH);
}
var client = new Client({
  puppeteer: { headless: true },
  session: sessionCfg,
});
client.initialize();
client.on("qr", (qr) => {
  //menampilkan qr code dan menerima qr code
  console.log("QR RECEIVED", qr);
});
client.on("authenticated", (session) => {
  console.log("AUTHENTICATED", session);
  sessionCfg = session;
  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
    //jika session belum tersimpan maka akan membuat session baru
    if (err) {
      console.error(err);
    }
  });
});
client.on("auth_failure", (msg) => {
  console.error("AUTHENTICATION FAILURE", msg);
});
client.on("ready", () => {
  console.log("READY");
});

client.on("disconnected", (reason) => {
  console.log("Client was logged out", reason);
});

client.on("message", async (msg) => {
  // console.table(msg);
  let chat = await msg.getChat();
  let perintah = msg.body.split("|");
  // console.table(perintah);
  // if (!chat.isGroup) {
  //dia akan menanggapi !corona jika chat bukan group

  // end remove bg

  if (!perintah[0] || !perintah[1]) {
    msg.reply("Contoh perintah :");
    msg.reply("catat|ini catatan kamu");
    msg.reply("nfa|aa*bcd");
    msg.reply("dfa|aa*bcd");
    msg.reply("youtube|https://www.youtube.com/watch?v=N2lhknM8HKY");
    msg.reply("Tanpa spasi diantara tanda | ");
  }

  // bot sticker

  // bot nfa
  else if (perintah[0].toLowerCase() == "nfa") {
    const parser = new regParser.RegParser(perintah[1]);
    const nfa = parser.parseToNFA();

    // console.log(nfa.toDotScript());
    // const result = new Viz(nfa.toDotScript(), "svg", "dot");
    viz
      .renderString(nfa.toDotScript())
      .then((result) => {
        // console.log(result);
        (async () => {
          const image = await svgToImg.from(result).toPng({
            encoding: "base64",
          });

          // console.log(image);
          const media = new MessageMedia("image/png", image);
          msg.reply(media);
        })();
      })
      .catch((error) => {
        // Create a new Viz instance (@see Caveats page for more info)
        // viz = new Viz({ Module, render });

        // Possibly display the error
        console.error(error);
      });
    // console.log(result);
    // msg.reply(result);
  }
  // end bot NSA

  // bot nfa
  else if (perintah[0].toLowerCase() == "dfa") {
    const parser = new regParser.RegParser(perintah[1]);
    const dfa = parser.parseToDFA();

    // console.log(nfa.toDotScript());
    // const result = new Viz(nfa.toDotScript(), "svg", "dot");
    viz
      .renderString(dfa.toDotScript())
      .then((result) => {
        // console.log(result);
        (async () => {
          const image = await svgToImg.from(result).toPng({
            encoding: "base64",
          });

          // console.log(image);
          const media = new MessageMedia("image/png", image);
          msg.reply(media);
        })();
      })
      .catch((error) => {
        // Create a new Viz instance (@see Caveats page for more info)
        // viz = new Viz({ Module, render });

        // Possibly display the error
        console.error(error);
      });
    // console.log(result);
    // msg.reply(result);
  }
  // end bot NSA

  // bot youtube
  else if (perintah[0].toLowerCase() == "youtube") {
    let body = "";
    https
      .get(
        `https://youtube-downloader3.herokuapp.com/video_info.php?url=${perintah[1]}`,
        (resp) => {
          // body = "data:" + resp.headers["content-type"] + ";base64,";
          resp.on("data", (data) => {
            body += data;
          });
          resp.on("end", () => {
            // console.log(body);
            let parsing = JSON.parse(body);
            let link = parsing.links
              ? parsing.links[0]
                ? parsing.links[0].url
                : "video tidak tersedia saat ini"
              : "Video tidak tersedia";
            // for (const property in link) {
            // console.log(`${property}: ${link[property]}`);
            msg.reply("Klik link dibawah ini untuk mendownload video :");
            msg.reply(link);
            // }

            //return res.json({result: body, status: 'success'});
          });
        }
      )
      .on("error", (e) => {
        console.log(`Got error: ${e.message}`);
      });
  } else if (perintah[0].toLowerCase() == "catat") {
    https
      .get(
        `https://salism3.pythonanywhere.com/write?text=${encodeURI(
          perintah[1]
        )}`,
        (res) => {
          var { statusCode } = res;
          var contentType = res.headers["content-type"];

          let error;
          // Any 2xx status code signals a successful response but
          // here we're only checking for 200.
          if (statusCode !== 200) {
            error = new Error(
              "Request Failed.\n" + `Status Code: ${statusCode}`
            );
          } else if (!/^application\/json/.test(contentType)) {
            error = new Error(
              "Invalid content-type.\n" +
                `Expected application/json but received ${contentType}`
            );
          }
          if (error) {
            console.error(error.message);
            // Consume response data to free up memory
            res.resume();
            return;
          }

          res.setEncoding("utf8");
          let rawData = "";
          res.on("data", (chunk) => {
            rawData += chunk;
          });
          res.on("end", () => {
            try {
              let body = "";
              let jeniFile;
              var parsedData = JSON.parse(rawData);
              // var media = MessageMedia.fromFilePath(parsedData.images[0]);
              // console.log(parsedData.images[0]);

              https
                .get(parsedData.images[0], (resp) => {
                  resp.setEncoding("base64");
                  jeniFile = resp.headers["content-type"];
                  // body = "data:" + resp.headers["content-type"] + ";base64,";
                  resp.on("data", (data) => {
                    body += data;
                  });
                  resp.on("end", () => {
                    // console.log(body);
                    var media = new MessageMedia(jeniFile, body);
                    msg.reply(media);
                    //return res.json({result: body, status: 'success'});
                  });
                })
                .on("error", (e) => {
                  console.log(`Got error: ${e.message}`);
                });
            } catch (e) {
              console.error(e.message);
            }
          });
        }
      )
      .on("error", (e) => {
        console.error(`Got error: ${e.message}`);
      });
  }
  // }
});
