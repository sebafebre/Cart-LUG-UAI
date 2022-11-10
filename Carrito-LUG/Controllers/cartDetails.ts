import { Request, Response} from "express";
import cartDetailsModel from "../Models/cartDetails";
//Para poder obtener los productos de la base de datos, deberé importar el modelo de producto
import productsModel from "../Models/products";
import cartModel from "../Models/cart";


const cartDetailsController = {
        //Req tendrá la información sobre la petición HTTP del Evento
        //Res devolverá la repuesta HTTP deseada.   
    
        productsInCart: async (req: Request, res: Response) => {
            try
            {
                const existeCarrito = await cartModel.find()
                if(existeCarrito)
                {
                //Obtener Productos
                const buscarProductos = await cartDetailsModel.find()
                //Se mostrará la lista de productos en el carrito
                res.status(200).send(buscarProductos)
                }else
                {
                    //Creará el carrito y se podrá operar
                   cartCreate()
                   res.status(200).send(`Se creo un carrito.`)
                }
               
            }
            catch (error)
            {
                //Código de error 500
                res.status(500).send(error)
            }
        },

        allCarts: async(req: Request, res: Response) => {
            try
            {
                const obtenerCarrito = await cartModel.find()
                if(obtenerCarrito)
                {   
                    res.status(200).send(obtenerCarrito)
                }else
                {
                    res.status(400).send(`No existen carritos registrados en la base de datos.`)
                }
            }
            catch(error)
            {
                res.status(500).send(error)
            }
        },
        
        addProduct: async (req: Request, res: Response) => {
            try
            {

                //Producto que se desea agregar, para agregar un producto se deberá escribir desde body
                const buscarProductos = await productsModel.findOne({productName: req.body.productName});
                const existeCarrito = await cartModel.findOne({productName: "Carrito"})
                //-----------const existeCarrito = await cartModel.findOne({productName:  req.body.productName})
                                    //Consultas mongoose
                if(!existeCarrito)
                {
                    //-----------const newCarrito = new cartModel({productName: req.body.productName, cartDetails: [], totalPrice: 0});
                    //-----------newCarrito.save();
                    cartCreate();
                }
                
                
                //Revisar si existe el producto antes de agregarlo
                if(buscarProductos?.productName && existeCarrito){
                //OperacionesCART es la amount de productos que se quiuere tener ahora y también tendrá el price que se obtendrá de la base de datos productos
                const OperacionesCART = {amount: req.body.amount, price: buscarProductos.price}
                if(OperacionesCART.amount <= buscarProductos.amount ){
                    //Si se cumple la condición, se agregará el producto y se descontará la amount de productos del model producto                   
                    //La variable Totalprice guardará el nuevo price según la amount de productos ingresados
                    const Totalprice = totalPrice(OperacionesCART.price, OperacionesCART.amount);
                    //La variable Totalprice pondrá el nuevo price del producto en el carrito
                    const addProducto = new cartDetailsModel({productName: buscarProductos?.productName, amount: req.body.amount, price: Totalprice}); 
                    await addProducto.save();
                    //Actualizar productos // La variable TotalStock guardará el stock total que quedo en la base de datos de Productos
                    const freeStockInList = freeStock(OperacionesCART.amount, buscarProductos.amount);
                    //carritoLenght obtenemos el tamaño del array
                    const carritoLenght = existeCarrito.cartDetails.length
                    //Para comprobar sí es 0 el Stock, sí es 0 se borrará el producto de la base de datos
                    if(freeStockInList == 0)
                    {
                        
                        existeCarrito?.cartDetails.push(addProducto)
                        existeCarrito.totalPrice = cartListPrice(existeCarrito.totalPrice, Totalprice);
                        existeCarrito.save();
                        buscarProductos.delete();
                        
                    }else{
                        buscarProductos.amount = freeStockInList;
                        buscarProductos.save();
                        existeCarrito?.cartDetails.push(addProducto)
                        existeCarrito.totalPrice = cartListPrice(existeCarrito.totalPrice, Totalprice);
                        existeCarrito.save();
                    }                            
                    //COndicionales para subir en array
                    res.status(200).send(addProducto);
                    }else
                    {
                        res.status(400).send(`No se puede agregar el producto porque el producto ${req.body.productName}\nno tiene stock suficiente.`);
                    }             
                }else{
                    res.status(404).send(`El producto ${req.body.productName} no existe en la base de datos.`)
                //HTTP STATUS NOT FOUND
                }
                
            }
            catch(error)
            {
                res.status(500).send(error);
            }
            
        },

        deleteByName: async (req: Request, res: Response) => {
            try
            {
                //Buscar el producto a eliminar del carrito con parametros
                const BuscarProducto = await cartDetailsModel.findOne({productName: req.body.productName})
                //Antes de eliminarlo creo también una variable que conecta con la base de datos de Producto
                const Productos = await productsModel.findOne({productName: req.body.productName})
                const existeCarrito = await cartModel.findOne({productName: "Carrito"})
                //-----------const existeCarrito = await cartModel.findOne({productName: req.params.productName})
                if(!existeCarrito)
                {
                    cartCreate()
                }
                
                //Este if sirve para comprobar si existe el producto deseado y también existe en la base de datos de Producto
                if(BuscarProducto?.productName && Productos?.productName){
                //Creo la variable del producto del carrito que se está por eliminar para devolver el stock en la base de datos de Producto
                    const StockCarrito = {amount: BuscarProducto?.amount}
                    //Guardo el stock que tiene almacenado la base de datos de Producto
                    const StockProductos = {amount: Productos?.amount}
                    //Ahora creo una variable que guardará el stock de ProductoCarrito y sumará ese Stock con el Stock de la base de datos de Producto
                    const TotalStock = totalAmount(StockCarrito.amount, StockProductos.amount);
                    const productoNombre = await cartDetailsModel.findOneAndDelete({productName: req.body.productName})
                    //Una vez eliminado la base de datos, se guardará los stock sumados a la base de datos de PRODUCTOS
                    Productos.amount = TotalStock;
                    
                    if(existeCarrito && BuscarProducto.price)
                    {
                        //Eliminar valores del array
                        const deleteProductoArray = existeCarrito.cartDetails.filter((BuscarProducto => BuscarProducto.productName != req.body.productName))
                        existeCarrito.cartDetails = deleteProductoArray;
                        existeCarrito.totalPrice = existeCarrito.totalPrice - BuscarProducto.price
                        existeCarrito.save();
                    }
                    Productos.save()
                    res.status(200).send(`El producto ${BuscarProducto.productName} se elimino con exito del carrito y \nse devolvió el stock del carrito a la base de datos de Productos`);                         
                //Sí esta condiciíon se activa es porque existe el producto en la base de datos Carrito pero no en la base de datos Productos
                }else if(BuscarProducto?.productName && !Productos?.productName && BuscarProducto.price) 
                {
                    //Operaciones Matemáticas para devolver el price Original
                    const OperacionesCART = {amount: BuscarProducto.amount, price: BuscarProducto.price}
                    const productPrice = price(OperacionesCART.price, OperacionesCART.amount);
                    //Volver a crear el producto en la base de datos productos
                    const newProducto = new productsModel({productName: BuscarProducto.productName, amount: BuscarProducto.amount, price: productPrice});
                    newProducto.save();
                    //Actualizar array
                    if(existeCarrito)
                    {
                        //Eliminar valores del array
                        const deleteProductoArray = existeCarrito.cartDetails.filter((BuscarProducto => BuscarProducto.productName != req.body.productName))
                        existeCarrito.cartDetails = deleteProductoArray;
                        existeCarrito.totalPrice = existeCarrito.totalPrice - BuscarProducto.price
                        existeCarrito.save();
                    }
                    //Ahora borrará el producto del carrito y lo devolverá a la base de datos productos
                    BuscarProducto.delete();
                    res.status(200).send(`El producto ${BuscarProducto.productName} se elimino con exito del carrito y \nse devolvió el stock del carrito a la base de datos de Productos`)
                }else{
                    res.status(404).send(`El producto ${req.body.productName} no existe en la base de datos`);
                }
                
            }
            catch(error)
            {
                res.status(500);
            }
        },

        changeAmount: async (req: Request, res: Response) => {
            try
            {
                //Se obtendrá el producto de la base de datos del carrito
                const obtenerProductoCART = await cartDetailsModel.findOne({productName: req.body.productName})
                //Se obtendrá el producto de la base de datos de producto
                const obtenerProducto = await productsModel.findOne({productName: req.body.productName})
                //El condicional este nos dirá si existen los dos productos en sus respectivas base de datos
                const existeCarrito = await cartModel.findOne({productName: "Carrito"})
                //-----------const existeCarrito = await cartModel.findOne({productName: req.body.productName})
                if(!existeCarrito)
                {
                    cartCreate();
                }

                if(obtenerProductoCART && obtenerProducto)
                {
                    //Obtenemos el amountTOTAL
                    const totalStock = totalAmount(obtenerProductoCART?.amount, obtenerProducto?.amount)
                    //Obtenemos el price del producto, no el price del producto en el carrito 
                    const productPrice = obtenerProducto?.price;
                    //Obtenemos la nueva amount que se quiere modificar
                    const newAmount = {amount: req.body.amount}
                    //Obtenemos el stock restante que será devuelto a la base de datos de producto
                    const freeStockInList = freeStock(newAmount.amount, totalStock)
                     //Crear una variable para guardar el price antiguo
                    const beforeCartPrice = obtenerProductoCART.price;
                    //En el siguiente condicional, se comprobará que la amount nueva de productos no sea negativa
                    //También si el price del producto del carrito existe y también el price del producto de la base de datos
                    if(freeStockInList >= 0 && productPrice && existeCarrito && obtenerProductoCART && beforeCartPrice)
                    {
                        
                     if(newAmount.amount != 0)
                     {
                        //Sí stock restante es 0 se borrará el producto de la base de datos
                        if(freeStockInList == 0)
                        {
                            obtenerProducto?.delete();
                        }else if(obtenerProducto?.amount != null)
                        {
                            obtenerProducto.amount = freeStockInList
                            obtenerProducto.save();
                        }
                       
                        obtenerProductoCART.amount = newAmount.amount
                        obtenerProductoCART.price = productPrice * newAmount.amount;
                        obtenerProductoCART.save();
                        //Actualizar Array
                        const index = existeCarrito.cartDetails.findIndex((producto) => {
                            return producto.productName == obtenerProductoCART.productName
                        });
                        const updateArray = existeCarrito.cartDetails.splice(index, 1)
                        existeCarrito.cartDetails.push(obtenerProductoCART);
                        //Comprobar si existe solo un producto en el carritp
                        existeCarrito.totalPrice = existeCarrito.totalPrice + obtenerProductoCART.price - beforeCartPrice 
                        existeCarrito.save();
                        res.status(200).send(`Se actualizo con exito el producto del carrito:\n* ${req.body.productName}\n* amount: ${newAmount.amount}\n\n`)
                     }
                     else
                      {
                        if(existeCarrito && obtenerProductoCART.price)
                        {
                        //Eliminar valores del array
                           
                        existeCarrito.cartDetails = existeCarrito.cartDetails.filter((producto) => {
                            return producto.productName != obtenerProductoCART.productName
                        })
                        existeCarrito.totalPrice = existeCarrito.totalPrice - obtenerProductoCART.price
                        existeCarrito.save();
                        }           
                        //Se eliminará el producto del carrito sí la nueva amount es 0
                        obtenerProducto.amount = freeStockInList;
                        obtenerProducto.save();
                        obtenerProductoCART.delete();
                        res.status(200).send(`Se elimino el producto del carrito y se envió el stock restante a \nla base de datos de Productos.`)
                      }    
                        
                    }else
                    {
                        res.status(400).send(`No hay stock suficiente.`);
                    }
                } 
                //El condicional este nos dirá si no existe en la base de datos carrito pero si existe el producto en la base de datos de producto     
                if(!obtenerProductoCART && obtenerProducto)
                {
                    res.status(400).send(`No se puede actualizar, el producto ${req.body.productName} no existe en el carrito.`)
                }
                // El condicional se activa si existe el producto en el carrito pero no en la base de datos de producto          
                if(obtenerProductoCART && !obtenerProducto)
                {
                    //Obtenemos el amountTOTAL
                    const totalStock = obtenerProductoCART.amount
                    //Obtenemos el price del producto, no el price del producto en el carrito 
                    const productPrice = price(obtenerProductoCART.price, totalStock)
                    //Obtenemos la nueva amount que se quiere modificar
                    const newAmount = {amount: req.body.amount}
                    //Obtenemos el stock restante que será devuelto a la base de datos de producto
                    const freeStockInList = freeStock(newAmount.amount, totalStock)
                    const beforeCartPrice = obtenerProductoCART.price;
                    //En el siguiente condicional, se comprobará que la amount nueva de productos no sea negativa ni 0
                    //También si el price del producto del carrito existe y también el price del producto de la base de datos
                    if(freeStockInList > 0)
                    {
                        //Sí la nueva amount es 0, entonces se borrará el producto de la base de datos y se devolverá todo sus valores a la base de datos productos
                        if(newAmount.amount == 0 && existeCarrito && obtenerProductoCART.price)
                        {
                            const createProduct = new productsModel({productName: obtenerProductoCART.productName, amount: freeStockInList, price: productPrice})
                            createProduct.save();
                           //Eliminar valores del array
                            existeCarrito.cartDetails = existeCarrito.cartDetails.filter((producto) => {
                            return producto.productName != obtenerProductoCART.productName
                            })
                            existeCarrito.totalPrice = existeCarrito.totalPrice - obtenerProductoCART.price
                            existeCarrito.save();
                            obtenerProductoCART.delete();
                            res.status(200).send(`Se elimino el producto ${req.body.productName} del carrito \ny se devolvió el stock a la base de datos Productos.`)
                        } 
                        if (newAmount.amount > 0 && existeCarrito && obtenerProductoCART.price && beforeCartPrice)
                        {
                            const createProduct = new productsModel({productName: obtenerProductoCART.productName, amount: freeStockInList, price: productPrice})
                            obtenerProductoCART.amount = newAmount.amount
                            obtenerProductoCART.price = totalPrice(productPrice, newAmount.amount)
                            createProduct.save();
                            obtenerProductoCART.save();
                            //Actualizar Array
                            const index = existeCarrito.cartDetails.findIndex((producto) => {
                                return producto.productName == obtenerProductoCART.productName
                                });
                                const updateArray = existeCarrito.cartDetails.splice(index, 1)
                                existeCarrito.cartDetails.push(obtenerProductoCART);
                                //Comprobar si existe solo un producto en el carritp
                                existeCarrito.totalPrice = existeCarrito.totalPrice + obtenerProductoCART.price - beforeCartPrice 
                                existeCarrito.save();
                            res.status(200).send(`Se actualizo con exito el producto del carrito:\n* Producto: ${obtenerProductoCART.productName}\n* Nueva amount: ${obtenerProductoCART.amount}\n* Nuevo price: ${obtenerProductoCART.price}\n\nSe devolvió a la base de datos producto:\n* Producto: ${req.body.productName}\n* Stock devuelto: ${freeStockInList}`)
                        }                       
                    }else
                    {
                        res.status(400).send(`No se pudo actualizar, debido a que supero la amount de stock, el stock total del producto ${obtenerProductoCART.productName} es de: ${obtenerProductoCART.amount}`)
                    }
                }
                if(!obtenerProductoCART && !obtenerProducto)
                {
                    res.status(400).send(`El producto ${req.body.productName} no existe.`)
                }
                
            }
            catch (error)
            {
                res.status(500).send(`Error en el servidor`);
            }
               
        },






































        moreProduct: async (req: Request, res: Response) => {
            try
            {
                //Se obtendrá el producto de la base de datos del carrito
                const obtenerProductoCART = await cartDetailsModel.findOne({productName: req.body.productName})
                //Se obtendrá el producto de la base de datos de producto
                const obtenerProducto = await productsModel.findOne({productName: req.body.productName})
                //El condicional este nos dirá si existen los dos productos en sus respectivas base de datos
                const existeCarrito = await cartModel.findOne({productName: "Carrito"})
                //-----------const existeCarrito = await cartModel.findOne({productName: req.body.productName})
                if(!existeCarrito)
                {
                    cartCreate();
                }

                if(obtenerProductoCART && obtenerProducto)
                {
                    //Obtenemos el amountTOTAL
                    const totalStock = totalAmount(obtenerProductoCART?.amount, obtenerProducto?.amount)
                    //Obtenemos el price del producto, no el price del producto en el carrito 
                    const productPrice = obtenerProducto?.price;
                    //Obtenemos la nueva amount que se quiere modificar
                    const newAmount = obtenerProductoCART.amount + 1;
                    //Obtenemos el stock restante que será devuelto a la base de datos de producto
                    const freeStockInList = freeStock(newAmount, totalStock)
                     //Crear una variable para guardar el price antiguo
                    const beforeCartPrice = obtenerProductoCART.price;
                    //En el siguiente condicional, se comprobará que la amount nueva de productos no sea negativa
                    //También si el price del producto del carrito existe y también el price del producto de la base de datos
                    if(freeStockInList >= 0 && productPrice && existeCarrito && obtenerProductoCART && beforeCartPrice)
                    {
                        
                     if(newAmount != 0)
                     {
                        //Sí stock restante es 0 se borrará el producto de la base de datos
                        if(freeStockInList == 0)
                        {
                            obtenerProducto?.delete();
                        }else if(obtenerProducto?.amount != null)
                        {
                            obtenerProducto.amount = freeStockInList
                            obtenerProducto.save();
                        }
                       
                        obtenerProductoCART.amount = newAmount
                        obtenerProductoCART.price = productPrice * newAmount;
                        obtenerProductoCART.save();
                        //Actualizar Array
                        const index = existeCarrito.cartDetails.findIndex((producto) => {
                            return producto.productName == obtenerProductoCART.productName
                        });
                        const updateArray = existeCarrito.cartDetails.splice(index, 1)
                        existeCarrito.cartDetails.push(obtenerProductoCART);
                        //Comprobar si existe solo un producto en el carritp
                        existeCarrito.totalPrice = existeCarrito.totalPrice + obtenerProductoCART.price - beforeCartPrice 
                        existeCarrito.save();
                        res.status(200).send(`Se actualizo con exito el producto del carrito:\n* ${req.body.productName}\n* amount: ${newAmount}\n\n`)
                     }
                     else
                      {
                        if(existeCarrito && obtenerProductoCART.price)
                        {
                        //Eliminar valores del array
                           
                        existeCarrito.cartDetails = existeCarrito.cartDetails.filter((producto) => {
                            return producto.productName != obtenerProductoCART.productName
                        })
                        existeCarrito.totalPrice = existeCarrito.totalPrice - obtenerProductoCART.price
                        existeCarrito.save();
                        }           
                        //Se eliminará el producto del carrito sí la nueva amount es 0
                        obtenerProducto.amount = freeStockInList;
                        obtenerProducto.save();
                        obtenerProductoCART.delete();
                        res.status(200).send(`Se elimino el producto del carrito y se envió el stock restante a \nla base de datos de Productos.`)
                      }    
                        
                    }else
                    {
                        res.status(400).send(`No hay stock suficiente.`);
                    }
                } 
                //El condicional este nos dirá si no existe en la base de datos carrito pero si existe el producto en la base de datos de producto     
                if(!obtenerProductoCART && obtenerProducto)
                {
                    res.status(400).send(`No se puede actualizar, el producto ${req.body.productName} no existe en el carrito.`)
                }
                // El condicional se activa si existe el producto en el carrito pero no en la base de datos de producto          
                if(obtenerProductoCART && !obtenerProducto)
                {
                    //Obtenemos el amountTOTAL
                    const totalStock = obtenerProductoCART.amount
                    //Obtenemos el price del producto, no el price del producto en el carrito 
                    const productPrice = price(obtenerProductoCART.price, totalStock)
                    //Obtenemos la nueva amount que se quiere modificar
                    const newAmount = {amount: req.body.amount}
                    //Obtenemos el stock restante que será devuelto a la base de datos de producto
                    const freeStockInList = freeStock(newAmount.amount, totalStock)
                    const beforeCartPrice = obtenerProductoCART.price;
                    //En el siguiente condicional, se comprobará que la amount nueva de productos no sea negativa ni 0
                    //También si el price del producto del carrito existe y también el price del producto de la base de datos
                    if(freeStockInList > 0)
                    {
                        //Sí la nueva amount es 0, entonces se borrará el producto de la base de datos y se devolverá todo sus valores a la base de datos productos
                        if(newAmount.amount == 0 && existeCarrito && obtenerProductoCART.price)
                        {
                            const createProduct = new productsModel({productName: obtenerProductoCART.productName, amount: freeStockInList, price: productPrice})
                            createProduct.save();
                           //Eliminar valores del array
                            existeCarrito.cartDetails = existeCarrito.cartDetails.filter((producto) => {
                            return producto.productName != obtenerProductoCART.productName
                            })
                            existeCarrito.totalPrice = existeCarrito.totalPrice - obtenerProductoCART.price
                            existeCarrito.save();
                            obtenerProductoCART.delete();
                            res.status(200).send(`Se elimino el producto ${req.body.productName} del carrito \ny se devolvió el stock a la base de datos Productos.`)
                        } 
                        if (newAmount.amount > 0 && existeCarrito && obtenerProductoCART.price && beforeCartPrice)
                        {
                            const createProduct = new productsModel({productName: obtenerProductoCART.productName, amount: freeStockInList, price: productPrice})
                            obtenerProductoCART.amount = newAmount.amount
                            obtenerProductoCART.price = totalPrice(productPrice, newAmount.amount)
                            createProduct.save();
                            obtenerProductoCART.save();
                            //Actualizar Array
                            const index = existeCarrito.cartDetails.findIndex((producto) => {
                                return producto.productName == obtenerProductoCART.productName
                                });
                                const updateArray = existeCarrito.cartDetails.splice(index, 1)
                                existeCarrito.cartDetails.push(obtenerProductoCART);
                                //Comprobar si existe solo un producto en el carritp
                                existeCarrito.totalPrice = existeCarrito.totalPrice + obtenerProductoCART.price - beforeCartPrice 
                                existeCarrito.save();
                            res.status(200).send(`Se actualizo con exito el producto del carrito:\n* Producto: ${obtenerProductoCART.productName}\n* Nueva amount: ${obtenerProductoCART.amount}\n* Nuevo price: ${obtenerProductoCART.price}\n\nSe devolvió a la base de datos producto:\n* Producto: ${req.body.productName}\n* Stock devuelto: ${freeStockInList}`)
                        }                       
                    }else
                    {
                        res.status(400).send(`No se pudo actualizar, debido a que supero la amount de stock, el stock total del producto ${obtenerProductoCART.productName} es de: ${obtenerProductoCART.amount}`)
                    }
                }
                if(!obtenerProductoCART && !obtenerProducto)
                {
                    res.status(400).send(`El producto ${req.body.productName} no existe.`)
                }
                
            }
            catch (error)
            {
                res.status(500).send(`Error en el servidor`);
            }
               
        },












        lessProduct: async (req: Request, res: Response) => {
            try
            {
                //Se obtendrá el producto de la base de datos del carrito
                const obtenerProductoCART = await cartDetailsModel.findOne({productName: req.body.productName})
                //Se obtendrá el producto de la base de datos de producto
                const obtenerProducto = await productsModel.findOne({productName: req.body.productName})
                //El condicional este nos dirá si existen los dos productos en sus respectivas base de datos
                const existeCarrito = await cartModel.findOne({productName: "Carrito"})
                //-----------const existeCarrito = await cartModel.findOne({productName: req.body.productName})
                if(!existeCarrito)
                {
                    cartCreate();
                }

                if(obtenerProductoCART && obtenerProducto)
                {
                    //Obtenemos el amountTOTAL
                    const totalStock = totalAmount(obtenerProductoCART?.amount, obtenerProducto?.amount)
                    //Obtenemos el price del producto, no el price del producto en el carrito 
                    const productPrice = obtenerProducto?.price;
                    //Obtenemos la nueva amount que se quiere modificar
                    const newAmount = obtenerProductoCART.amount - 1;
                    //Obtenemos el stock restante que será devuelto a la base de datos de producto
                    const freeStockInList = freeStock(newAmount, totalStock)
                     //Crear una variable para guardar el price antiguo
                    const beforeCartPrice = obtenerProductoCART.price;
                    //En el siguiente condicional, se comprobará que la amount nueva de productos no sea negativa
                    //También si el price del producto del carrito existe y también el price del producto de la base de datos
                    if(freeStockInList >= 0 && productPrice && existeCarrito && obtenerProductoCART && beforeCartPrice)
                    {
                        
                     if(newAmount != 0)
                     {
                        //Sí stock restante es 0 se borrará el producto de la base de datos
                        if(newAmount == 0)
                        {
                            obtenerProducto?.delete();
                        }else if(obtenerProducto?.amount != null)
                        {
                            obtenerProducto.amount = freeStockInList
                            obtenerProducto.save();
                        }
                       
                        obtenerProductoCART.amount = newAmount
                        obtenerProductoCART.price = productPrice * newAmount;
                        obtenerProductoCART.save();
                        //Actualizar Array
                        const index = existeCarrito.cartDetails.findIndex((producto) => {
                            return producto.productName == obtenerProductoCART.productName
                        });
                        const updateArray = existeCarrito.cartDetails.splice(index, 1)
                        existeCarrito.cartDetails.push(obtenerProductoCART);
                        //Comprobar si existe solo un producto en el carritp
                        existeCarrito.totalPrice = existeCarrito.totalPrice + obtenerProductoCART.price - beforeCartPrice 
                        existeCarrito.save();
                        res.status(200).send(`Se actualizo con exito el producto del carrito:\n* ${req.body.productName}\n* amount: ${newAmount}\n\n`)
                     }
                     else
                      {
                        if(existeCarrito && obtenerProductoCART.price)
                        {
                        //Eliminar valores del array
                           
                        existeCarrito.cartDetails = existeCarrito.cartDetails.filter((producto) => {
                            return producto.productName != obtenerProductoCART.productName
                        })
                        existeCarrito.totalPrice = existeCarrito.totalPrice - obtenerProductoCART.price
                        existeCarrito.save();
                        }           
                        //Se eliminará el producto del carrito sí la nueva amount es 0
                        obtenerProducto.amount = freeStockInList;
                        obtenerProducto.save();
                        obtenerProductoCART.delete();
                        res.status(200).send(`Se elimino el producto del carrito y se envió el stock restante a \nla base de datos de Productos.`)
                      }    
                        
                    }else
                    {
                        res.status(400).send(`No hay stock suficiente.`);
                    }
                } 
                //El condicional este nos dirá si no existe en la base de datos carrito pero si existe el producto en la base de datos de producto     
                if(!obtenerProductoCART && obtenerProducto)
                {
                    res.status(400).send(`No se puede actualizar, el producto ${req.body.productName} no existe en el carrito.`)
                }
                // El condicional se activa si existe el producto en el carrito pero no en la base de datos de producto          
                if(obtenerProductoCART && !obtenerProducto)
                {
                    //Obtenemos el amountTOTAL
                    const totalStock = obtenerProductoCART.amount
                    //Obtenemos el price del producto, no el price del producto en el carrito 
                    const productPrice = price(obtenerProductoCART.price, totalStock)
                    //Obtenemos la nueva amount que se quiere modificar
                    const newAmount = {amount: req.body.amount}
                    //Obtenemos el stock restante que será devuelto a la base de datos de producto
                    const freeStockInList = freeStock(newAmount.amount, totalStock)
                    const beforeCartPrice = obtenerProductoCART.price;
                    //En el siguiente condicional, se comprobará que la amount nueva de productos no sea negativa ni 0
                    //También si el price del producto del carrito existe y también el price del producto de la base de datos
                    if(freeStockInList > 0)
                    {
                        //Sí la nueva amount es 0, entonces se borrará el producto de la base de datos y se devolverá todo sus valores a la base de datos productos
                        if(newAmount.amount == 0 && existeCarrito && obtenerProductoCART.price)
                        {
                            const createProduct = new productsModel({productName: obtenerProductoCART.productName, amount: freeStockInList, price: productPrice})
                            createProduct.save();
                           //Eliminar valores del array
                            existeCarrito.cartDetails = existeCarrito.cartDetails.filter((producto) => {
                            return producto.productName != obtenerProductoCART.productName
                            })
                            existeCarrito.totalPrice = existeCarrito.totalPrice - obtenerProductoCART.price
                            existeCarrito.save();
                            obtenerProductoCART.delete();
                            res.status(200).send(`Se elimino el producto ${req.body.productName} del carrito \ny se devolvió el stock a la base de datos Productos.`)
                        } 
                        if (newAmount.amount > 0 && existeCarrito && obtenerProductoCART.price && beforeCartPrice)
                        {
                            const createProduct = new productsModel({productName: obtenerProductoCART.productName, amount: freeStockInList, price: productPrice})
                            obtenerProductoCART.amount = newAmount.amount
                            obtenerProductoCART.price = totalPrice(productPrice, newAmount.amount)
                            createProduct.save();
                            obtenerProductoCART.save();
                            //Actualizar Array
                            const index = existeCarrito.cartDetails.findIndex((producto) => {
                                return producto.productName == obtenerProductoCART.productName
                                });
                                const updateArray = existeCarrito.cartDetails.splice(index, 1)
                                existeCarrito.cartDetails.push(obtenerProductoCART);
                                //Comprobar si existe solo un producto en el carritp
                                existeCarrito.totalPrice = existeCarrito.totalPrice + obtenerProductoCART.price - beforeCartPrice 
                                existeCarrito.save();
                            res.status(200).send(`Se actualizo con exito el producto del carrito:\n* Producto: ${obtenerProductoCART.productName}\n* Nueva amount: ${obtenerProductoCART.amount}\n* Nuevo price: ${obtenerProductoCART.price}\n\nSe devolvió a la base de datos producto:\n* Producto: ${req.body.productName}\n* Stock devuelto: ${freeStockInList}`)
                        }                       
                    }else
                    {
                        res.status(400).send(`No se pudo actualizar, debido a que supero la amount de stock, el stock total del producto ${obtenerProductoCART.productName} es de: ${obtenerProductoCART.amount}`)
                    }
                }
                if(!obtenerProductoCART && !obtenerProducto)
                {
                    res.status(400).send(`El producto ${req.body.productName} no existe.`)
                }
                
            }
            catch (error)
            {
                res.status(500).send(`Error en el servidor`);
            }
               
        },

}



















function price(priceTOTAL: any, amount: any)
{
    //price = priceTOTAL/amount
    return priceTOTAL/amount;
}

function totalAmount(amount: any, freeStockInList: any)
{
    return amount + freeStockInList;
}

function freeStock(newAmount: any, totalStock: any)
{
    //Ecuación utilizada: freeStockInList = totalStock - newAmount
    return totalStock - newAmount;
}

function totalPrice(price: any, amount: any)
{
    //Ecuación utilizada: priceTOTAL = price * amount
    return price * amount;
}

function cartCreate()
{
    const newCarrito = new cartModel({productName: "Carrito", cartDetails: [], totalPrice: 0});
    newCarrito.save();
}

function cartListPrice(priceTOTALCARRITOLIST: any, priceTOTALCARRITODETAILS: any)
{
    return priceTOTALCARRITODETAILS + priceTOTALCARRITOLIST;
}

export default cartDetailsController;