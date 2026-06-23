"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PinDisplay } from "@/components/ui/PinDisplay";
import { PinPad } from "@/components/ui/PinPad";
import { useAppStore } from "@/store/useAppStore";
import { validarPinMozo } from "@/acciones/auth";

export default function MozoLogin() {
  const router = useRouter();
  const setMozo = useAppStore((state) => state.setMozo);
  
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Al alcanzar 4 dígitos, simulamos validación
    if (pin.length === 4) {
      handlePinSubmit(pin);
    }
  }, [pin]);

  const handlePinSubmit = async (enteredPin: string) => {
    setLoading(true);
    setError(false);

    const res = await validarPinMozo(enteredPin);

    if (res.success && res.mozo) {
      setSuccess(true);
      setMozo(res.mozo);
      
      setTimeout(() => {
        router.push('/mozo/mesas');
      }, 1000);
    } else {
      setError(true);
      setPin("");
      setLoading(false);
      setTimeout(() => setError(false), 1000);
    }
  };

  const handleDigitPress = (digit: string) => {
    if (pin.length < 4 && !loading && !success) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDeletePress = () => {
    if (pin.length > 0 && !loading && !success) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  return (
    <main className="h-screen w-full flex flex-col items-center justify-between p-6 pb-12 bg-zinc-950">
      <div className="w-full flex-1 flex flex-col items-center mt-12">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">ComandasApp</h1>
        <p className="text-zinc-400 text-sm mb-8">Ingresa tu PIN de Mozo</p>
        
        <PinDisplay pin={pin} length={4} />
        
        {/* Espacio para mensajes de feedback */}
        <div className="h-8 flex items-center justify-center">
          {error && <p className="text-red-500 font-medium animate-pulse">PIN incorrecto</p>}
          {success && <p className="text-emerald-500 font-medium">¡Autenticado!</p>}
          {loading && <p className="text-zinc-400 font-medium animate-pulse">Validando...</p>}
        </div>
      </div>

      <div className="w-full">
        <PinPad 
          onDigitPress={handleDigitPress} 
          onDeletePress={handleDeletePress} 
          disabled={loading || success} 
        />
      </div>
    </main>
  );
}
