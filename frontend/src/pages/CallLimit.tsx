import React, { useState } from 'react';

const CallLimit = () => {
  const [callLimit, setCallLimit] = useState<string>(''); // State for the input value

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCallLimit(event.target.value); // Update state when input changes
  };

  const handleSave = () => {
    // Logic to handle save, you can send the callLimit value to your API or state
    console.log(`Saving call limit: ${callLimit}`);
    // Optionally clear the input field or show a success message after saving
  };

  return (
    <>
      <div className="space-y-4 mt-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Calls Within the Time Frame</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tracks the total number of calls made within a specified time period.
              </p>

              {/* Call Limit Input */}
              <label htmlFor="call-limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-3">
                Enter Call Limit:
              </label>
              <input
                type="number"
                id="call-limit"
                value={callLimit}
                onChange={handleInputChange}
                className="w-full mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100"
                placeholder="Enter call limit"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-4">
            <button
              onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
            disabled={!callLimit || isNaN(Number(callLimit))} // Disable if input is empty or not a number
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CallLimit;
