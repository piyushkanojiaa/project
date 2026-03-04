/**
 * Real-Time Notification Badge Component
 * 
 * Displays live notification count from GraphQL subscriptions
 */

import React from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useCriticalAlerts } from '../hooks/useSubscriptions';

export default function RealTimeNotifications() {
    const { alerts, unreadCount, clearUnread } = useCriticalAlerts();
    const [showDropdown, setShowDropdown] = React.useState(false);

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={() => {
                    setShowDropdown(!showDropdown);
                    if (unreadCount > 0) clearUnread();
                }}
                className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
                <Bell className="w-6 h-6 text-cyan-400" />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-cyan-500/30 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-cyan-500/20">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-semibold">Critical Alerts</h3>
                            <span className="flex items-center gap-1 text-green-400 text-xs">
                                <Wifi className="w-3 h-3" />
                                Live
                            </span>
                        </div>
                    </div>

                    {alerts.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            No critical alerts
                        </div>
                    ) : (
                        <div className="divide-y divide-cyan-500/10">
                            {alerts.slice(0, 10).map((alert, index) => (
                                <div
                                    key={`${alert.id}-${index}`}
                                    className="p-3 hover:bg-white/5 cursor-pointer"
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0 animate-pulse" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium text-sm truncate">
                                                {alert.satelliteName} ↔ {alert.debrisName}
                                            </p>
                                            <p className="text-gray-400 text-xs mt-1">
                                                Miss: {alert.missDistance.toFixed(2)} km • PoC: {(alert.probability * 100).toFixed(4)}%
                                            </p>
                                            <p className="text-gray-500 text-xs mt-1">
                                                {new Date(alert.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
