import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";

import { generateAIResponse } from "./aiService.js";

export const sendMessageService = async ({
  message,
  chatId,
  userId,
}) => {

  let chat;

  // CREATE CHAT
  if (!chatId) {

    chat = await Chat.create({
      user_id: userId,
      title: message.slice(0, 40),
    });

  } else {

    chat = await Chat.findById(chatId);

    if (!chat) {
      throw new Error("Chat not found");
    }
  }

  // SAVE USER MESSAGE
  await Message.create({
    chat_id: chat._id,
    sender: "user",
    message,
  });

  // FETCH CHAT HISTORY
  const messages = await Message.find({
    chat_id: chat._id,
    })
    .sort({ created_at: -1 })
    .limit(20);

    const orderedMessages =
    messages.reverse();

  // FORMAT CONTEXT
  const formattedMessages = orderedMessages.map(
    (msg) => ({
      role: msg.sender,
      content: msg.message,
    })
  );

  // GENERATE AI RESPONSE
  const aiReply =
    await generateAIResponse(formattedMessages);

  // SAVE AI RESPONSE
  const assistantMessage =
    await Message.create({
      chat_id: chat._id,
      sender: "assistant",
      message: aiReply,
    });

  return {
    chatId: chat._id,
    assistantMessage,
  };
};

export const getUserChatsService = async (userId) => {

  return await Chat.find({
    user_id: userId,
  }).sort({ updated_at: -1 });
};

export const getChatMessagesService = async (chatId) => {

  return await Message.find({
    chat_id: chatId,
  }).sort({ created_at: 1 });
};

export const deleteChatService = async (chatId) => {

  await Chat.findByIdAndDelete(chatId);

  await Message.deleteMany({
    chat_id: chatId,
  });
};

export const renameChatService = async ({
  chatId,
  title,
}) => {

  return await Chat.findByIdAndUpdate(
    chatId,
    { title },
    { new: true }
  );
};