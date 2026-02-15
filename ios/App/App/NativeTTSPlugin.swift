import Foundation
import Capacitor
import AVFoundation

@objc(NativeTTSPlugin)
public class NativeTTSPlugin: CAPPlugin, CAPBridgedPlugin, AVSpeechSynthesizerDelegate {
    
    // MARK: - CAPBridgedPlugin Protocol
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
    
    // MARK: - Properties
    private var synthesizer: AVSpeechSynthesizer!
    private var currentCall: CAPPluginCall?
    
    // MARK: - Audio Session Management
    
    /// Configure audio session for high-quality TTS playback
    private func configureAudioSessionForPlayback() {
        do {
            let session = AVAudioSession.sharedInstance()
            
            // CRITICAL: If other audio is playing (e.g., STT session not fully released),
            // we MUST wait for it to finish before we can configure our session
            if session.isOtherAudioPlaying {
                print("[NativeTTS] ⚠️ Other audio is playing - waiting for it to release...")
                
                // Wait up to 1 second (100ms x 10 attempts) for the other audio to finish
                // Frontend already waited 500ms, so we only need a short additional wait
                var attempts = 0
                let maxAttempts = 10
                
                while session.isOtherAudioPlaying && attempts < maxAttempts {
                    Thread.sleep(forTimeInterval: 0.1)
                    attempts += 1
                    print("[NativeTTS] Waiting for audio session release (attempt \(attempts)/\(maxAttempts))...")
                }
                
                if session.isOtherAudioPlaying {
                    print("[NativeTTS] ⚠️ Other audio STILL playing after \(maxAttempts) attempts")
                    print("[NativeTTS] Using .mixWithOthers fallback to allow degraded playback")
                    
                    // Fallback: Use .mixWithOthers to at least allow our audio to play
                    // This will result in degraded quality but better than nothing
                    if #available(iOS 12.0, *) {
                        try session.setCategory(.playback, mode: .spokenAudio, options: [.mixWithOthers])
                    } else {
                        try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
                    }
                    
                    // Activate with .mixWithOthers
                    try session.setActive(true, options: [])
                    
                    print("[NativeTTS] Audio session configured with .mixWithOthers (degraded mode)")
                    return  // IMPORTANT: Exit early to skip the normal activation below
                } else {
                    print("[NativeTTS] ✅ Audio session released after \(attempts) attempts")
                }
            }
            
            // Normal path: Session is free or no conflicts
            try session.setActive(false, options: [.notifyOthersOnDeactivation])
            
            // Set category and mode for high-quality playback
            if #available(iOS 12.0, *) {
                try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
            } else {
                try session.setCategory(.playback, mode: .default, options: [.duckOthers])
            }
            
            // Activate the session
            try session.setActive(true, options: [])
            
            print("[NativeTTS] Audio session configured for playback (mode: \(session.mode.rawValue))")
        } catch {
            print("[NativeTTS] Audio session configuration error: \(error)")
        }
    }
    
    /// Deactivate audio session and notify other apps they can resume
    private func deactivateAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            
            // Deactivate and notify other apps they can resume
            try session.setActive(false, options: [.notifyOthersOnDeactivation])
            
            print("[NativeTTS] Audio session deactivated")
        } catch {
            print("[NativeTTS] Audio session deactivation error: \(error)")
        }
    }
    
    
    // MARK: - Lifecycle
    public override func load() {
        print("[NativeTTSPlugin] load() called - plugin is being initialized!")
        synthesizer = AVSpeechSynthesizer()
        synthesizer.delegate = self
        print("[NativeTTSPlugin] AVSpeechSynthesizer initialized, voices available: \(AVSpeechSynthesisVoice.speechVoices().count)")
    }
    
    // MARK: - Plugin Methods
    @objc func getVoices(_ call: CAPPluginCall) {
        print("[NativeTTSPlugin] getVoices called!")
        
        let voices = AVSpeechSynthesisVoice.speechVoices()
        var voiceData: [[String: Any]] = []
        
        for voice in voices {
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
            
            voiceData.append([
                "identifier": voice.identifier,
                "name": cleanName,
                "fullName": voice.name,
                "language": voice.language,
                "quality": quality
            ])
        }
        
        print("[NativeTTSPlugin] Returning \(voiceData.count) voices")
        call.resolve(["voices": voiceData])
    }
    
    @objc func speak(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.isEmpty else {
            call.reject("Text is required")
            return
        }
        
        // Stop any current speech AND clean up audio session
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
            deactivateAudioSession()
        }
        
        // Configure audio session BEFORE creating utterance
        configureAudioSessionForPlayback()
        
        let utterance = AVSpeechUtterance(string: text)
        
        // Set voice if specified
        if let voiceIdentifier = call.getString("voiceIdentifier") {
            if let voice = AVSpeechSynthesisVoice(identifier: voiceIdentifier) {
                utterance.voice = voice
            } else {
                // Try to find voice by language if identifier not found
                let languageCode = String(voiceIdentifier.prefix(5))
                utterance.voice = AVSpeechSynthesisVoice(language: languageCode)
            }
        }
        
        // Set speech parameters with defaults
        let rate = call.getFloat("rate") ?? 0.5
        utterance.rate = max(AVSpeechUtteranceMinimumSpeechRate, min(AVSpeechUtteranceMaximumSpeechRate, rate))
        
        let pitch = call.getFloat("pitch") ?? 1.0
        utterance.pitchMultiplier = max(0.5, min(2.0, pitch))
        
        let volume = call.getFloat("volume") ?? 1.0
        utterance.volume = max(0.0, min(1.0, volume))
        
        // Store call for callback
        currentCall = call
        
        // Start speaking
        synthesizer.speak(utterance)
    }
    
    @objc func stop(_ call: CAPPluginCall) {
        synthesizer.stopSpeaking(at: .immediate)
        deactivateAudioSession()  // Clean up audio session
        currentCall = nil
        call.resolve()
    }
    
    @objc func pause(_ call: CAPPluginCall) {
        synthesizer.pauseSpeaking(at: .word)
        call.resolve()
    }
    
    @objc func resume(_ call: CAPPluginCall) {
        synthesizer.continueSpeaking()
        call.resolve()
    }
    
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
        
        // Deactivate audio session
        deactivateAudioSession()
        
        // Resolve the pending call
        if let call = currentCall {
            call.resolve(["completed": true])
            currentCall = nil
        }
    }
    
    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        notifyListeners("speechCancel", data: [:])
        
        // Deactivate audio session when cancelled
        deactivateAudioSession()
        
        // Resolve the pending call
        if let call = currentCall {
            call.resolve(["completed": false, "cancelled": true])
            currentCall = nil
        }
    }
}
