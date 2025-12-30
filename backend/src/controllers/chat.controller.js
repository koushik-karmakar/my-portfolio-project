import { Chat } from "../models/chat.model";
import Message from "../models/message.model";

const getchat = asyncHandler(async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    throw new ApiErrorHandle(400, "User not found!");
  }

  const chats = await Chat.aggregate([
    {
      $match: {
        members: new mongoose.Types.ObjectId(user_id),
      },
    },

    {
      $lookup: {
        from: "messages",
        localField: "lastMessage",
        foreignField: "_id",
        as: "lastMessage",
      },
    },

    {
      $unwind: {
        path: "$lastMessage",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "members",
        foreignField: "_id",
        as: "members",
      },
    },

    {
      $addFields: {
        members: {
          $filter: {
            input: "$members",
            as: "member",
            cond: {
              $ne: ["$$member._id", new mongoose.Types.ObjectId(user_id)],
            },
          },
        },
      },
    },

    {
      $sort: {
        "lastMessage.createdAt": -1,
      },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, chats, "Chats fetched successfully"));
});
const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const messages = await Message.aggregate([
    {
      $match: {
        chatId: new mongoose.Types.ObjectId(chatId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "senderId",
        foreignField: "_id",
        as: "sender",
      },
    },
    {
      $unwind: "$sender",
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        "sender._id": 1,
        "sender.fullname": 1,
        "sender.avatar": 1,
      },
    },
    {
      $sort: { createdAt: 1 },
    },
  ]);

  res.status(200).json(new ApiResponse(200, messages, "Messages fetched"));
});

export { getchat, getMessages };
