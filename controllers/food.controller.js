import Food from "../models/food.js";


// ADMIN: Add a food item
// ADMIN: Add a food item
export const addFood = async (req, res, next) => {
  try {
    // Destructure name, price, and unit from the request body
    const { name, price, unit, Quantity } = req.body;

    // Create a new food document in the database
    const food = await Food.create({ name, price, unit, Quantity });

    // Respond with success and the created food
    res.status(201).json({
      success: true,
      message: "Food added successfully",
      food
    });
  } catch (error) {
    next(error);
  }
};


// Get all food items
export const getAllFoods = async (req, res, next) => {
  try {
    const foods = await Food.find();

    res.status(200).json({
      success: true,
      foods
    });
  } catch (error) {
    next(error);
  }
};




