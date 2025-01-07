import { type UUID, type Character } from "@elizaos/core";

const BASE_URL = "http://localhost:3000";

const fetcher = async ({
    url,
    method,
    body,
    headers,
}: {
    url: string;
    method?: "GET" | "POST";
    body?: object;
    headers?: HeadersInit;
}) => {
    const options: RequestInit = {
        method: method ?? "GET",
        headers: headers
            ? headers
            : {
                  Accept: "application/json",
                  "Content-Type": "application/json",
              },
    };

    if (method === "POST" && body) {
        options.body = JSON.stringify(body);
    }

    return fetch(`${BASE_URL}${url}`, options).then(async (resp) => {
        if (resp.ok) {
            const contentType = resp.headers.get("Content-Type");

            if (contentType == "audio/mpeg") {
                return await resp.blob();
            }
            return resp.json();
        }

        const errorText = await resp.text();
        console.error("Error: ", errorText);

        let errorMessage = "An error occurred.";
        try {
            const errorObj = JSON.parse(errorText);
            errorMessage = errorObj.message || errorMessage;
        } catch {
            errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
    });
};

export const apiClient = {
    sendMessage: (agentId: string, message: string) =>
        fetcher({
            url: `/${agentId}/message`,
            method: "POST",
            body: {
                text: message,
                user: "user",
            },
        }),
    getAgents: () => fetcher({ url: "/agents" }),
    getAgent: (agentId: string): Promise<{ id: UUID; character: Character }> =>
        fetcher({ url: `/agents/${agentId}` }),

    tts: (agentId: string, text: string) =>
        fetcher({
            url: `/${agentId}/tts`,
            method: "POST",
            body: {
                text,
            },
            headers: {
                "Content-Type": "application/json",
                Accept: "audio/mpeg",
                "Transfer-Encoding": "chunked",
            },
        }),
};