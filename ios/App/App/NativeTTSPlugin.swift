import Foundation
import Capacitor
import AVFoundation

/**
 * NativeTTSPlugin - Provides access to iOS native AVSpeechSynthesizer
 * 
 * This plugin exposes ALL installed iOS voices (including premium/downloaded ones)
 * to the web layer, bypassing WKWebView's limited speechSynthesis.getVoices() API.
 */
@objc(NativeTTSPlugin)
public class NativeTTSPlugin: CAPPlugin, CAPBridgedPlugin, AVSpeechSynthesizerDelegate {
    public let identifier = "NativeTTSPlugin"
    public let jsName = "NativeTTS"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getVoices", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "speak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isSpeaking", returnType: CAPPluginReturnPromise)
    ]
    
    private let synthesizer = AVSpeechSynthesizer()
    private var currentCall: CAPPluginCall?
    
    override public func load() {
        synthesizer.delegate = self
    }
    
    /**
     * Get all available voices on the device
     * Returns voices with identifier, name, language, and quality
     */
    @objc func getVoices(_ call: CAPPluginCall) {
        let voices = AVSpeechSynthesisVoice.speechVoices()
        
        let voiceData = voices.map { voice -> [String: Any] in
            // Determine quality level
            var quality = "default"
            if #available(iOS 13.0, *) {
                switch voice.quality {
                case .enhanced:
                    quality = "enhanced"
                case .premium:
                    quality = "premium"
                default:
                    quality = "default"
                }
            }
            
            // Extract clean name (remove language suffix if present)
            var cleanName = voice.name
            if let range = cleanName.range(of: " (", options: .backwards) {
                cleanName = String(cleanName[..<range.lowerBound])
            }
            
            return [
                "identifier": voice.identifier,
                "name": cleanName,
                "fullName": voice.name,
                "language": voice.language,
                "quality": quality
            ]
        }
        
        call.resolve([
            "voices": voiceData
        ])
    }
    
    /**
     * Speak text using the specified voice
     * @param text - The text to speak
     * @param voiceIdentifier - Optional voice identifier (uses default if not specified)
     * @param rate - Speech rate (0.0 to 1.0, default 0.5)
     * @param pitch - Speech pitch (0.5 to 2.0, default 1.0)
     * @param volume - Volume (0.0 to 1.0, default 1.0)
     */
    @objc func speak(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.isEmpty else {
            call.reject("Text is required")
            return
        }
        
        // Stop any current speech
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        
        let utterance = AVSpeechUtterance(string: text)
        
        // Set voice if specified
        if let voiceIdentifier = call.getString("voiceIdentifier") {
            if let voice = AVSpeechSynthesisVoice(identifier: voiceIdentifier) {
                utterance.voice = voice
            } else {
                // Try to find voice by language if identifier not found
                let languageCode = String(voiceIdentifier.prefix(5)) // e.g., "de-DE"
                utterance.voice = AVSpeechSynthesisVoice(language: languageCode)
            }
        }
        
        // Set speech parameters
        let rate = call.getFloat("rate") ?? 0.5
        utterance.rate = max(AVSpeechUtteranceMinimumSpeechRate, 
                            min(AVSpeechUtteranceMaximumSpeechRate, rate))
        
        let pitch = call.getFloat("pitch") ?? 1.0
        utterance.pitchMultiplier = max(0.5, min(2.0, pitch))
        
        let volume = call.getFloat("volume") ?? 1.0
        utterance.volume = max(0.0, min(1.0, volume))
        
        // Store call for callback
        currentCall = call
        
        // Configure audio session for playback
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenContent, options: [.duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("[NativeTTS] Audio session error: \(error)")
        }
        
        // Start speaking
        synthesizer.speak(utterance)
    }
    
    /**
     * Stop speaking immediately
     */
    @objc func stop(_ call: CAPPluginCall) {
        synthesizer.stopSpeaking(at: .immediate)
        currentCall = nil
        call.resolve()
    }
    
    /**
     * Pause speaking
     */
    @objc func pause(_ call: CAPPluginCall) {
        synthesizer.pauseSpeaking(at: .word)
        call.resolve()
    }
    
    /**
     * Resume speaking
     */
    @objc func resume(_ call: CAPPluginCall) {
        synthesizer.continueSpeaking()
        call.resolve()
    }
    
    /**
     * Check if currently speaking
     */
    @objc func isSpeaking(_ call: CAPPluginCall) {
        call.resolve([
            "speaking": synthesizer.isSpeaking,
            "paused": synthesizer.isPaused
        ])
    }
    
    // MARK: - AVSpeechSynthesizerDelegate
    
    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        notifyListeners("speechStart", data: [:])
    }
    
    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        notifyListeners("speechEnd", data: [:])
        
        // Resolve the pending call
        if let call = currentCall {
            call.resolve(["completed": true])
            currentCall = nil
        }
        
        // Deactivate audio session
        do {
            try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        } catch {
            print("[NativeTTS] Audio session deactivation error: \(error)")
        }
    }
    
    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        notifyListeners("speechCancel", data: [:])
        
        // Resolve the pending call
        if let call = currentCall {
            call.resolve(["completed": false, "cancelled": true])
            currentCall = nil
        }
    }
}
