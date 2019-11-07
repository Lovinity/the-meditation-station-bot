const fetch = require("node-fetch");

module.exports = async (url, options, type) => {
    if (typeof options === "undefined") {
        options = {};
        type = "json";
    } else if (typeof options === "string") {
        type = options;
        options = {};
    } else if (typeof type === "undefined") {
        type = "json";
    }

    const query = new URLSearchParams(options.query || {});

    url = `${url}?${query}`;

    const result = await fetch(url, options);
    if (!result.ok) throw new Error(`${url} - ${result.status}`);

    switch (type) {
        case "result": return result;
        case "buffer": return result.buffer();
        case "json": return result.json();
        case "text": return result.text();
        default: throw new Error(`Unknown type ${type}`);
    }
}