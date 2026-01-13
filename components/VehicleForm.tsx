import React, { useState } from 'react';
import type { Vehicle, User } from '../types';
import { WrenchIcon } from './Icons';
import { decodeVin } from '../services/apiClient';

interface VehicleFormProps {
  vehicle: Vehicle;
  setVehicle: React.Dispatch<React.SetStateAction<Vehicle>>;
  task: string;
  setTask: React.Dispatch<React.SetStateAction<string>>;
  onAnalyze: (e: React.FormEvent) => void;
  user: User | null;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ vehicle, setVehicle, task, setTask, onAnalyze, user }) => {
  const [vin, setVin] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [vinError, setVinError] = useState<string | null>(null);

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVehicle({ ...vehicle, [e.target.name]: e.target.value });
  };

  const handleDecodeVin = async () => {
    setIsDecoding(true);
    setVinError(null);
    try {
      const decodedVehicle = await decodeVin(vin);
      setVehicle(decodedVehicle);
    } catch (error) {
      if (error instanceof Error) {
        setVinError(error.message);
      } else {
        setVinError("An unknown error occurred during VIN decoding.");
      }
    } finally {
      setIsDecoding(false);
    }
  };
  
  const isFormComplete = vehicle.year && vehicle.make && vehicle.model && task;

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <WrenchIcon className="w-16 h-16 mx-auto text-brand-cyan" />
        <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 uppercase tracking-wider">AI Auto Repair</h1>
        <p className="text-lg text-gray-300 mt-2">
          Your personal AI mechanic for repairs and diagnostics.
        </p>
      </div>

      <form onSubmit={onAnalyze} className="bg-black/50 backdrop-blur-sm border border-brand-cyan/30 p-8 rounded-xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-brand-cyan-light mb-4 uppercase tracking-widest">1. Identify Vehicle</h2>
          <div className="space-y-2">
            <label htmlFor="vin" className="block text-sm font-medium text-gray-300">Enter VIN for automatic lookup</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                id="vin"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="17-Digit VIN"
                maxLength={17}
                className="flex-grow w-full px-4 py-3 bg-gray-900 text-white border-2 border-brand-cyan/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition uppercase"
              />
              <button
                type="button"
                onClick={handleDecodeVin}
                disabled={isDecoding || vin.length !== 17}
                className="px-6 py-3 bg-brand-cyan text-black font-bold rounded-lg hover:bg-brand-cyan-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-cyan transition-all duration-300 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isDecoding ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent border-solid rounded-full animate-spin"></div>
                ) : (
                  'Decode'
                )}
              </button>
            </div>
             {vinError && <p className="text-sm text-red-400 mt-1">{vinError}</p>}
          </div>

          <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-brand-cyan/30"></div>
              <span className="flex-shrink mx-4 text-gray-300 font-semibold">OR</span>
              <div className="flex-grow border-t border-brand-cyan/30"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="year"
              value={vehicle.year}
              onChange={handleVehicleChange}
              placeholder="Year"
              className="w-full px-4 py-3 bg-gray-900 text-white border-2 border-brand-cyan/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition"
              required
            />
            <input
              type="text"
              name="make"
              value={vehicle.make}
              onChange={handleVehicleChange}
              placeholder="Make"
              className="w-full px-4 py-3 bg-gray-900 text-white border-2 border-brand-cyan/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition"
              required
            />
            <input
              type="text"
              name="model"
              value={vehicle.model}
              onChange={handleVehicleChange}
              placeholder="Model"
              className="w-full px-4 py-3 bg-gray-900 text-white border-2 border-brand-cyan/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition"
              required
            />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-brand-cyan-light mb-4 uppercase tracking-widest">2. Describe Task</h2>
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g., 'Replace front brakes' or 'Car won't start'"
            className="w-full px-4 py-3 bg-gray-900 text-white border-2 border-brand-cyan/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition"
            required
          />
        </div>

        <div className="pt-2">
           <button
            type="submit"
            disabled={!isFormComplete}
            className="w-full flex items-center justify-center bg-brand-cyan text-black font-bold py-3 px-4 rounded-lg hover:bg-brand-cyan-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-cyan transition-all duration-300 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <WrenchIcon className="w-5 h-5 mr-2" />
            Analyze Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
