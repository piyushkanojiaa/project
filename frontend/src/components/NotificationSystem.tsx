import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, CheckCircle, Bell } from 'lucide-react';

export interface Notification {
    id: string;
    type: 'critical' | 'high' | 'medium' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    conjunctionId?: string;
}

interface NotificationSystemProps {
    maxNotifications?: number;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
    maxNotifications = 5
}) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const getIcon = (type: string) => {
        switch (type) {
            case 'critical':
            case 'high':
                return <AlertTriangle className="w-5 h-5" />;
            case 'info':
                return <Info className="w-5 h-5" />;
            default:
                return <Bell className="w-5 h-5" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'critical':
                return 'from-red-500/20 to-red-600/10 border-red-500/50 text-red-100';
            case 'high':
                return 'from-orange-500/20 to-orange-600/10 border-orange-500/50 text-orange-100';
            case 'medium':
                return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/50 text-yellow-100';
            default:
                return 'from-blue-500/20 to-blue-600/10 border-blue-500/50 text-blue-100';
        }
    };

    const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
        const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, maxNotifications));
        setIsOpen(true);

        // Auto-hide info notifications after 5 seconds
        if (notification.type === 'info') {
            setTimeout(() => {
                removeNotification(newNotification.id);
            }, 5000);
        }
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    // Expose addNotification globally for other components
    useEffect(() => {
        (window as any).addNotification = addNotification;
        return () => {
            delete (window as any).addNotification;
        };
    }, []);

    const unreadCount = notifications.filter(n => n.type !== 'info').length;

    return (
        <>
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 right-4 z-50 bg-gray-900/80 backdrop-blur-lg border border-gray-700 rounded-lg p-3 hover:bg-gray-800 transition group"
                title="Notifications"
            >
                <Bell className="w-6 h-6 text-gray-300 group-hover:text-white transition" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div className="fixed top-16 right-4 z-50 w-96 max-h-[600px] bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-blue-400" />
                            <h3 className="font-semibold text-white">Alerts</h3>
                            {unreadCount > 0 && (
                                <span className="text-xs text-gray-400">({unreadCount} active)</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="text-xs text-gray-400 hover:text-white transition"
                                >
                                    Clear All
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[500px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No active alerts</p>
                                <p className="text-sm mt-1">All systems nominal</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`p-4 border-b border-gray-800 bg-gradient-to-r ${getColor(notif.type)} border-l-4 hover:bg-gray-800/50 transition cursor-pointer`}
                                    onClick={() => {
                                        if (notif.conjunctionId) {
                                            console.log('Navigate to conjunction:', notif.conjunctionId);
                                        }
                                    }}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-semibold text-sm">{notif.title}</h4>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeNotification(notif.id);
                                                    }}
                                                    className="text-gray-400 hover:text-white transition flex-shrink-0"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-300 mt-1">{notif.message}</p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {notif.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

// Helper function to add notifications from anywhere
export const notify = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    if (typeof window !== 'undefined' && (window as any).addNotification) {
        (window as any).addNotification(notification);
    }
};
