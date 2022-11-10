

import  { Router } from "express";
import productsRoutes from "././products";
import cartDetailsRoutes from "././cartDetails";

const router = Router();

router.use("/product", productsRoutes)
router.use("/cart", cartDetailsRoutes)


export default router;