import {
  getForecastValidationData,
  runForecastValidation,
} from "../services/forecastValidationService.js";

export const getForecastValidation = async (req, res) => {
  try {
    const data = await getForecastValidationData({
      stationId: req.query.stationId,
      runId: req.query.runId,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching forecast validation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch forecast validation data",
      error: error.message,
    });
  }
};

export const triggerForecastValidationRun = async (req, res) => {
  try {
    const run = await runForecastValidation({
      runDate: req.body?.runDate,
    });

    res.status(200).json({
      success: true,
      message: "Forecast validation run completed",
      data: run,
    });
  } catch (error) {
    console.error("Error running forecast validation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to run forecast validation",
      error: error.message,
    });
  }
};
