import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, HelpCircle } from 'lucide-react';
import ModernButton from './ModernButton';
import ModernCard from './ModernCard';

interface VoiceControlProps {
    onCommand?: (command: string, action: string) => void;
}

interface VoiceResponse {
    status: string;
    action: string;
    message: string;
    speech?: string;
    commands?: string[];
}

export const VoiceControl: React.FC<VoiceControlProps> = ({ onCommand }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState<VoiceResponse | null>(null);
    const [recognition, setRecognition] = useState<any>(null);
    const [isSupported, setIsSupported] = useState(true);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Check browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        // Initialize Web Speech API
        const recognizer = new SpeechRecognition();
        recognizer.continuous = false;
        recognizer.interimResults = true;
        recognizer.lang = 'en-US';

        recognizer.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcriptText = event.results[current][0].transcript;
            setTranscript(transcriptText);

            if (event.results[current].isFinal) {
                // Send to backend via WebSocket
                sendVoiceCommand(transcriptText);
            }
        };

        recognizer.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognizer.onend = () => {
            setIsListening(false);
        };

        setRecognition(recognizer);

        // Initialize WebSocket connection
        const ws = new WebSocket('ws://localhost:8000/ws/voice');

        ws.onopen = () => {
            console.log('Voice control WebSocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setResponse(data);

            // Speak response
            if (data.speech) {
                speak(data.speech);
            }

            // Notify parent component
            if (onCommand && data.action) {
                onCommand(transcript, data.action);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        wsRef.current = ws;

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);

    const sendVoiceCommand = (text: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ text }));
        }
    };

    const toggleListening = () => {
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            setResponse(null);
            recognition.start();
            setIsListening(true);
            speak('Listening for command');
        }
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            window.speechSynthesis.speak(utterance);
        }
    };

    const showHelp = () => {
        const helpText = 'Available commands: Show satellites, Get conjunctions, Analyze risk for satellite name, Plan maneuver for satellite name, System status, Show analytics, and Help';
        speak(helpText);
        setResponse({
            status: 'info',
            action: 'help',
            message: 'Help requested',
            speech: helpText
        });
    };

    if (!isSupported) {
        return (
            <ModernCard variant="glass-medium" className="border-2 border-amber-500/30">
                <div className="flex items-center gap-3">
                    <HelpCircle className="text-amber-400" size={24} />
                    <div>
                        <p className="text-white font-semibold">Voice Control Not Supported</p>
                        <p className="text-gray-400 text-sm">Your browser doesn't support Web Speech API. Try Chrome or Edge.</p>
                    </div>
                </div>
            </ModernCard>
        );
    }

    return (
        <ModernCard variant="glass-ultra" glow={isListening} glowColor="blue">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Volume2 className="text-blue-400" size={20} />
                        <h3 className="text-lg font-semibold text-white">Voice Control</h3>
                    </div>
                    <ModernButton
                        variant="ghost"
                        size="sm"
                        icon={<HelpCircle size={16} />}
                        onClick={showHelp}
                    >
                        Help
                    </ModernButton>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-3">
                    <ModernButton
                        variant={isListening ? 'danger' : 'primary'}
                        icon={isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        onClick={toggleListening}
                        className="flex-1"
                    >
                        {isListening ? 'Stop Listening' : 'Start Voice Command'}
                    </ModernButton>
                </div>

                {/* Transcript Display */}
                {transcript && (
                    <div className="glass-subtle p-4 rounded-lg animate-fade-in">
                        <div className="flex items-start gap-3">
                            <Mic className="text-blue-400 flex-shrink-0 mt-1" size={18} />
                            <div className="flex-1">
                                <p className="text-xs text-gray-400 mb-1">You said:</p>
                                <p className="text-white font-medium">{transcript}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Response Display */}
                {response && (
                    <div className={`
            glass-subtle p-4 rounded-lg animate-scale-in
            ${response.status === 'success' ? 'border-l-4 border-green-500' : ''}
            ${response.status === 'error' ? 'border-l-4 border-red-500' : ''}
          `}>
                        <div className="flex items-start gap-3">
                            <Volume2 className={`
                flex-shrink-0 mt-1
                ${response.status === 'success' ? 'text-green-400' : 'text-red-400'}
              `} size={18} />
                            <div className="flex-1">
                                <p className="text-xs text-gray-400 mb-1">Response:</p>
                                <p className="text-white">{response.message}</p>
                                {response.commands && (
                                    <ul className="mt-2 space-y-1">
                                        {response.commands.map((cmd, idx) => (
                                            <li key={idx} className="text-sm text-gray-300">• {cmd}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Commands */}
                <div className="pt-3 border-t border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-2">Try these commands:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="glass-subtle p-2 rounded">
                            <span className="text-blue-400">•</span>
                            <span className="text-gray-300 ml-1">"Show satellites"</span>
                        </div>
                        <div className="glass-subtle p-2 rounded">
                            <span className="text-blue-400">•</span>
                            <span className="text-gray-300 ml-1">"Get conjunctions"</span>
                        </div>
                        <div className="glass-subtle p-2 rounded">
                            <span className="text-blue-400">•</span>
                            <span className="text-gray-300 ml-1">"System status"</span>
                        </div>
                        <div className="glass-subtle p-2 rounded">
                            <span className="text-blue-400">•</span>
                            <span className="text-gray-300 ml-1">"Show analytics"</span>
                        </div>
                    </div>
                </div>
            </div>
        </ModernCard>
    );
};

export default VoiceControl;
