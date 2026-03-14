import api from "./api";

export async function askCampusBot(message) {
  const { data } = await api.post("/chatbot/chat", { message });
  return data;
}
