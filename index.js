import "dotenv/config";
import fetch from "node-fetch";
import tinycolor from "tinycolor2";

const FILE = `https://www.figma.com/file/mEWgkkHu99Y9tTeWbp8MMU/Specify-%C2%B7-File-Example?node-id=0%3A1`;

async function apiRequest(endpoint) {
  try {
    const resp = await fetch("https://api.figma.com/v1" + endpoint, {
      method: "GET",
      headers: { "x-figma-token": process.env.FIGMA_ACCESS_TOKEN },
    });

    return resp.json();
  } catch (error) {
    console.error(error);
  }
}

function getFileKey(pageUrl) {
  return pageUrl.pathname.replace("/file/", "").replace(/\/.*/, "");
}

function getNodeId(pageUrl) {
  return decodeURIComponent(pageUrl.search).replace("?node-id=", "");
}


async function run() {
  const pageUrl = new URL(FILE);
  const fileKey = getFileKey(pageUrl);
  const nodeId = getNodeId(pageUrl);

  const resp = await apiRequest("/files/" + fileKey + "?ids=" + nodeId);
  
  const examples = resp.document.children.find(
    ({ name }) => name.toLowerCase() === "examples"
  );
  const colors = examples.children.find(({ name }) =>
    name.toLowerCase().includes("color")
    && name.toLowerCase().includes("frame")
  ).children;

  let tokens = {
    color: { },
  };

  colors.forEach(color => {
    tokens.color = {
      ...tokens.color,
      [color.name.toLowerCase()]: {
        value: tinycolor.fromRatio(color.fills.pop().color).toHexString(),
        type: "color"
      }
    };
  });

  console.log(JSON.stringify(tokens));
}

run();
