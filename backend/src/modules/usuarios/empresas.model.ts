import mongoose, { Schema } from 'mongoose';

const empresaSchema = new Schema({
    nombre: { type: String, required: true, trim: true, maxlength: 200 },
    codigo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    activo: { type: Boolean, default: true },
    creadaPor: { type: String, required: true },
}, { timestamps: true, collection: 'empresasOperadoras' });

export const EmpresaOperadora = mongoose.model('EmpresaOperadora', empresaSchema);
