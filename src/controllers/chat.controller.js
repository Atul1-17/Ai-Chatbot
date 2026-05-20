import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {Chat} from "../models/chat.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { 
    sendMessageService,
    getUserChatsService,
    getChatMessagesService,
    deleteChatService,
    renameChatService

 } from "../services/chat.Service.js"

const sendMessage = asyncHandler(async (req, res) => {
    const { message, chatId } = req.body;

    const userId = req.user._id;

    // validation
    if (!message) {
        return res.status(400).json({
        success: false,
        message: "Message is required",
        });
    }

    const result = await sendMessageService({
        message,
        chatId,
        userId,
    });

    return res.status(200).json({
        success: true,
        message: "Message sent successfully",
        data: result,
    });
});

const getUserChats = asyncHandler(async (req, res) => {

  const userId = req.user._id;

  const chats =
    await getUserChatsService(userId);

  return res.status(200).json({
    success: true,
    data: chats,
  });
});

const getChatMessages = asyncHandler(async (req, res) => {

  const { chatId } = req.params;

  const messages =
    await getChatMessagesService(chatId);

  return res.status(200).json({
    success: true,
    data: messages,
  });
});

const deleteChat = asyncHandler(async (req, res) => {

  const { chatId } = req.params;

  await deleteChatService(chatId);

  return res.status(200).json({
    success: true,
    message: "Chat deleted successfully",
  });
});

const renameChat = asyncHandler(async (req, res) => {

  const { chatId } = req.params;

  const { title } = req.body;

  // validation
  if (!title) {
    return res.status(400).json({
      success: false,
      message: "Title is required",
    });
  }

  const updatedChat =
    await renameChatService({
      chatId,
      title,
    });

  return res.status(200).json({
    success: true,
    message: "Chat renamed successfully",
    data: updatedChat,
  });
});

export {
    sendMessage,
    getUserChats,
    getChatMessages,
    deleteChat,
    renameChat
}