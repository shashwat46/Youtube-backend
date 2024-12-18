//MARK: Using promises

const asyncHandler= (requestHandler) => {
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((error) => next(error))
    }
}



export {asyncHandler}




//MARK: Using try catch
// const asyncHandler = () => {} 
// const asyncHandler = (func) => {() => {} }
// const asyncHandler = (fn) => async () => {}
//All of those above steps condensed into the statement below

// const asyncHandler = (func) => async (req,res,next) => {
//     try {
//         await func(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }