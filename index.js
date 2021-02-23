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

// Ideally, this would be moved to a serverless function.
// You would create a Figma plugin that hits the serverless
// function, passing the open file in the payload.
// This function would be modified to match the structure
// of your Figma file. This has the advantage of giving
// you full control of how your Figma file is transformed
// into design tokens represented by a JSON file, allowing
// you to have the expected input before Style Dictionary
// does its transformations.
async function run() {
  // Parse the file to prepare for making the request
  const pageUrl = new URL(FILE);
  const fileKey = getFileKey(pageUrl);
  const nodeId = getNodeId(pageUrl);

  // Call the Figma API to get contents of the file
  const resp = await apiRequest("/files/" + fileKey + "?ids=" + nodeId);
  
  // We begin the process of accessing the contents
  // of the Figma file so we can shape them into
  // the format we desire.
  // You would have to update this given the contents
  // of your Figma file.
  // Ideally, each company would have a template so this
  // works across multiple files. 
  const examples = resp.document.children.find(
    ({ name }) => name.toLowerCase() === "examples"
  );

  // We extract the colors from the sample file.
  // Only the colors are extracted to make this simpler.
  const colors = examples.children.find(({ name }) =>
    name.toLowerCase().includes("color")
    && name.toLowerCase().includes("frame")
  ).children;

  // With each color node, we can extract the color and
  // transform it into a hex string thanks to tinycolor2.
  // The structure of color -> [some-color] -> value, type
  // is match the Category, Item, Type format of Style
  // Dictionary: https://amzn.github.io/style-dictionary/#/properties
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

  // Instead of logging, you could do something with the JSON.
  // You could use this as a CLI tool that writes the JSON to a file.
  // Ideally, since this will be a serverless function hit by
  // a Figma plugin, you would use the GitHub API to commit
  // the JSON tokens to a Style Dictionary repository,
  // kicking off the process to transform the tokens to platform
  // deliverables and deliver them to consuming applications.
  console.log(JSON.stringify(tokens));
}

run();
