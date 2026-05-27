const asynkHandler = (fu) => async (req, res, next) => {
  try {
    await fu(req, res, next);
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export { asynkHandler };
