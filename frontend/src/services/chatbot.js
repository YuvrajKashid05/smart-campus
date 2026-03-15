import api from "./api";

export async function askCampusBot(message, history = []) {
  const { data } = await api.post("/chatbot/chat", { message, history });
  return data;
}
