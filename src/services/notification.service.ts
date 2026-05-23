import Notification from '../models/Notification'
import User from '../models/User'
import { getIO } from '../config/socket'

export interface NotificationData {
	userId: string
	type:
		| 'message'
		| 'grade'
		| 'absent'
		| 'announcement'
		| 'event'
		| 'homework'
		| 'approval'
	title: string
	message: string
	link?: string
	data?: Record<string, any>
}

/**
 * Create a notification and emit it in real-time
 */
export const createNotification = async (
	data: NotificationData
): Promise<void> => {
	try {
		const notification = new Notification({
			id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			userId: data.userId,
			type: data.type,
			title: data.title,
			message: data.message,
			isRead: false,
			link: data.link,
			data: data.data
		})

		await notification.save()

		// Emit real-time notification
		const io = getIO()
		if (io) {
			io.to(`user:${data.userId}`).emit('notification:new', {
				id: notification.id,
				type: notification.type,
				title: notification.title,
				message: notification.message,
				link: notification.link,
				createdAt: notification.createdAt
			})
		}
	} catch (error) {
		console.error('Failed to create notification:', error)
	}
}

/**
 * Create notifications for multiple users
 */
export const createBulkNotifications = async (
	userIds: string[],
	notificationData: Omit<NotificationData, 'userId'>
): Promise<void> => {
	const notifications = userIds.map((userId) => ({
		id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		userId,
		type: notificationData.type,
		title: notificationData.title,
		message: notificationData.message,
		isRead: false,
		link: notificationData.link,
		data: notificationData.data
	}))

	try {
		await Notification.insertMany(notifications)

		// Emit to all users
		const io = getIO()
		if (io) {
			userIds.forEach((userId) => {
				io.to(`user:${userId}`).emit('notification:new', {
					type: notificationData.type,
					title: notificationData.title,
					message: notificationData.message,
					link: notificationData.link
				})
			})
		}
	} catch (error) {
		console.error('Failed to create bulk notifications:', error)
	}
}

/**
 * Notify all users with a specific role
 */
export const notifyByRole = async (
	role: 'admin' | 'teacher' | 'parent',
	notificationData: Omit<NotificationData, 'userId'>
): Promise<void> => {
	try {
		const users = await User.find({ role, isApproved: true }).select('_id')
		const userIds = users.map((user) => user._id.toString())
		await createBulkNotifications(userIds, notificationData)
	} catch (error) {
		console.error('Failed to notify by role:', error)
	}
}

/**
 * Mark notification as read
 */
export const markNotificationRead = async (
	notificationId: string,
	userId: string
): Promise<boolean> => {
	try {
		const result = await Notification.updateOne(
			{ id: notificationId, userId },
			{ isRead: true }
		)
		return result.modifiedCount > 0
	} catch (error) {
		console.error('Failed to mark notification as read:', error)
		return false
	}
}

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsRead = async (
	userId: string
): Promise<number> => {
	try {
		const result = await Notification.updateMany(
			{ userId, isRead: false },
			{ isRead: true }
		)
		return result.modifiedCount
	} catch (error) {
		console.error('Failed to mark all notifications as read:', error)
		return 0
	}
}

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
	try {
		return await Notification.countDocuments({ userId, isRead: false })
	} catch (error) {
		console.error('Failed to get unread count:', error)
		return 0
	}
}

/**
 * Get notifications for a user with pagination
 */
export const getNotifications = async (
	userId: string,
	options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
) => {
	const query: Record<string, any> = { userId }
	if (options.unreadOnly) query.isRead = false

	const notifications = await Notification.find(query)
		.sort({ createdAt: -1 })
		.limit(options.limit || 20)
		.skip(options.offset || 0)

	const total = await Notification.countDocuments(query)

	return { notifications, total }
}
