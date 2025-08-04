// PATH: backend/src/controllers/ai/chatController.js
const conversationalAI = require('../../services/ai/conversationalAI');
const novaClassifier   = require('../../services/analysis/novaClassifier');
const Alternatives     = require('../../services/ai/alternativesEngine');
const alternatives     = new Alternatives();

exports.test = (req,res) =>
  res.json({ success:true, message:'AI routes are working!' });

exports.chat = async (req,res)=>{
  try{
    const { message, sessionId, product } = req.body;
    if(!message) return res.status(400).json({error:'message required'});
    const ctx = product?.ingredients
      ? { product:{...product,analysis:{nova:novaClassifier.classify(product.ingredients)}}}
      : {};
    const ai   = await conversationalAI.chat(message, ctx, sessionId);
    if(ctx.product){
      ai.alternatives = await alternatives.getAlternativesForProduct(ctx.product);
    }
    res.json(ai);
  }catch(e){
    console.error(e); res.status(500).json({error:'chat failed'});
  }
};
