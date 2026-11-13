import mongoose, { Schema } from 'mongoose';

const counters = new Schema({ _id: String, value: Number }, { collection: 'contadoresOperativos' });
const Counter = mongoose.model('ContadorOperativo', counters);

async function siguienteNumero(collection: string) {
    const counter = await Counter.findOneAndUpdate(
        { _id: collection }, { $inc: { value: 1 } }, { upsert: true, new: true },
    ).orFail();
    return counter.value!;
}

export function numeroOperativo(schema: Schema) {
    schema.add({ numeroOperativo: { type: Number, immutable: true } });
    schema.index({ numeroOperativo: 1 }, { unique: true, sparse: true });
    schema.pre('save', async function () {
        if (this.isNew) this.set('numeroOperativo', await siguienteNumero((this.constructor as mongoose.Model<unknown>).collection.name));
    });
}

export async function numerarRegistrosExistentes() {
    const collections = ['viajesNacionales', 'viajesInternacionales', 'camiones', 'semirremolques', 'choferes', mongoose.model('Usuario').collection.name];
    for (const name of collections) {
        const collection = mongoose.connection.collection(name);
        const existing = await collection.find({ numeroOperativo: { $type: 'number' } }).sort({ numeroOperativo: -1 }).limit(1).next();
        if (existing) {
            await Counter.updateOne({ _id: name }, { $max: { value: existing.numeroOperativo } }, { upsert: true });
        }
        await collection.createIndex({ numeroOperativo: 1 }, { unique: true, sparse: true });
        const pendientes = collection.find({ numeroOperativo: { $exists: false } }).sort({ createdAt: 1, _id: 1 });
        for await (const item of pendientes) {
            const numeroOperativo = await siguienteNumero(name);
            await collection.updateOne({ _id: item._id, numeroOperativo: { $exists: false } }, { $set: { numeroOperativo } });
        }
    }
}
