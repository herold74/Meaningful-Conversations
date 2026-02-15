import Foundation
import Capacitor
import Speech
import AVFoundation

@objc(NativeSTTPlugin)
public class NativeSTTPlugin: CAPPlugin, CAPBridgedPlugin {
    
    // MARK: - CAPBridgedPlugin Protocol
    public let identifier = "NativeSTTPlugin"
    public let jsName = "NativeSTT"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise)
    ]
    
    // MARK: - Properties
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var audioEngine: AVAudioEngine?
    private var isRecording = false
    
    // MARK: - Plugin Methods
    
    @objc func isAvailable(_ call: CAPPluginCall) {
        let available = SFSpeechRecognizer.authorizationStatus() != .restricted
        call.resolve(["available": available])
    }
    
    @objc func requestPermission(_ call: CAPPluginCall) {
        SFSpeechRecognizer.requestAuthorization { status in
            switch status {
            case .authorized:
                // Also request microphone permission
                AVAudioSession.sharedInstance().requestRecordPermission { granted in
                    call.resolve(["granted": granted && status == .authorized])
                }
            case .denied, .restricted, .notDetermined:
                call.resolve(["granted": false])
            @unknown default:
                call.resolve(["granted": false])
            }
        }
    }
    
    @objc func start(_ call: CAPPluginCall) {
        let language = call.getString("language") ?? "en-US"
        
        print("[NativeSTT] start() called with language: \(language)")
        
        // Stop any existing recognition
        stopRecognition()
        
        // Check authorization
        let authStatus = SFSpeechRecognizer.authorizationStatus()
        guard authStatus == .authorized else {
            print("[NativeSTT] Not authorized (status: \(authStatus.rawValue)), requesting permission...")
            
            SFSpeechRecognizer.requestAuthorization { [weak self] status in
                if status == .authorized {
                    // Also need mic permission
                    AVAudioSession.sharedInstance().requestRecordPermission { granted in
                        if granted {
                            self?.startRecognition(language: language, call: call)
                        } else {
                            print("[NativeSTT] Microphone permission denied")
                            call.reject("Microphone permission denied")
                        }
                    }
                } else {
                    print("[NativeSTT] Speech recognition permission denied")
                    call.reject("Speech recognition permission denied")
                }
            }
            return
        }
        
        // Check mic permission
        let micStatus = AVAudioSession.sharedInstance().recordPermission
        guard micStatus == .granted else {
            print("[NativeSTT] Microphone not granted, requesting...")
            AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
                if granted {
                    self?.startRecognition(language: language, call: call)
                } else {
                    print("[NativeSTT] Microphone permission denied")
                    call.reject("Microphone permission denied")
                }
            }
            return
        }
        
        startRecognition(language: language, call: call)
    }
    
    @objc func stop(_ call: CAPPluginCall) {
        print("[NativeSTT] stop() called")
        stopRecognition()
        call.resolve()
    }
    
    // MARK: - Private Methods
    
    private func startRecognition(language: String, call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            do {
                // Create speech recognizer for the requested language
                guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: language)) else {
                    print("[NativeSTT] Speech recognizer not available for language: \(language)")
                    call.reject("Speech recognizer not available for \(language)")
                    return
                }
                
                guard recognizer.isAvailable else {
                    print("[NativeSTT] Speech recognizer not currently available")
                    call.reject("Speech recognizer not currently available")
                    return
                }
                
                self.speechRecognizer = recognizer
                
                // Configure audio session for recording
                let audioSession = AVAudioSession.sharedInstance()
                try audioSession.setCategory(.record, mode: .measurement, options: [])
                try audioSession.setActive(true, options: [])
                
                print("[NativeSTT] Audio session configured for recording")
                print("[NativeSTT] Audio session category: \(audioSession.category.rawValue)")
                print("[NativeSTT] Audio session mode: \(audioSession.mode.rawValue)")
                
                // Create recognition request
                let request = SFSpeechAudioBufferRecognitionRequest()
                request.shouldReportPartialResults = true
                
                // Use on-device recognition if available (iOS 13+)
                if #available(iOS 13.0, *) {
                    if recognizer.supportsOnDeviceRecognition {
                        request.requiresOnDeviceRecognition = false // Allow server for better quality
                        print("[NativeSTT] On-device recognition available (using server for quality)")
                    }
                }
                
                self.recognitionRequest = request
                
                // Create audio engine
                let engine = AVAudioEngine()
                self.audioEngine = engine
                
                let inputNode = engine.inputNode
                let recordingFormat = inputNode.outputFormat(forBus: 0)
                
                inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
                    self?.recognitionRequest?.append(buffer)
                }
                
                // Start recognition task
                self.recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
                    guard let self = self else { return }
                    
                    if let result = result {
                        let transcript = result.bestTranscription.formattedString
                        let isFinal = result.isFinal
                        
                        // Send partial results to JS
                        self.notifyListeners("partialResult", data: [
                            "transcript": transcript,
                            "isFinal": isFinal
                        ])
                        
                        if isFinal {
                            print("[NativeSTT] Final result: \(transcript)")
                        }
                    }
                    
                    if let error = error {
                        print("[NativeSTT] Recognition error: \(error.localizedDescription)")
                        self.notifyListeners("error", data: [
                            "message": error.localizedDescription
                        ])
                        self.stopRecognition()
                    }
                }
                
                // Start the audio engine
                engine.prepare()
                try engine.start()
                
                self.isRecording = true
                print("[NativeSTT] ✅ Recognition started successfully")
                
                // Notify JS that recognition started
                self.notifyListeners("started", data: [:])
                
                call.resolve()
                
            } catch {
                print("[NativeSTT] ❌ Failed to start recognition: \(error)")
                self.stopRecognition()
                call.reject("Failed to start speech recognition: \(error.localizedDescription)")
            }
        }
    }
    
    private func stopRecognition() {
        print("[NativeSTT] Stopping recognition...")
        
        // Stop audio engine
        if let engine = audioEngine, engine.isRunning {
            engine.stop()
            engine.inputNode.removeTap(onBus: 0)
        }
        audioEngine = nil
        
        // End recognition request
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        
        // Cancel recognition task
        recognitionTask?.cancel()
        recognitionTask = nil
        
        isRecording = false
        
        // Deactivate audio session to release it for TTS
        do {
            try AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
            print("[NativeSTT] ✅ Audio session deactivated after STT stop")
            print("[NativeSTT] isOtherAudioPlaying: \(AVAudioSession.sharedInstance().isOtherAudioPlaying)")
        } catch {
            print("[NativeSTT] ⚠️ Failed to deactivate audio session: \(error)")
        }
        
        // Notify JS that recognition ended
        notifyListeners("stopped", data: [:])
    }
}
