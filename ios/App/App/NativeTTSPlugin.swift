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
        
        // Configure audio session for playback
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: .duckOthers)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("[NativeTTS] Audio session error: \(error)")
        }
        
        // Start speaking
        synthesizer.speak(utterance)
    }
    
    @objc func stop(_ call: CAPPluginCall) {
        synthesizer.stopSpeaking(at: .immediate)
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
