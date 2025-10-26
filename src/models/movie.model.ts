import { Document, Schema, Types, model } from "mongoose";

// 1️⃣ Define a TypeScript interface for the Movie document
export interface IMovie extends Document {
    _id: Types.ObjectId;
    title: string;
    overview?: string;
    genres?: string[];
    language?: string;
    releaseDate?: Date;
    cast?: string[];
    posterUrl?: string;
    trailerUrl?: string;
    ottAssetKey?: string;
    ratingAvg: number;
    ratingCount: number;
    status: "upcoming" | "in-theaters" | "released";
    expiredAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;

}

// 2️⃣ Define schema with type parameter <IMovie>
const MovieSchema = new Schema<IMovie>(
    {
        title: { type: String, required: true, index: true },
        overview: String,
        genres: [String],
        language: String,
        releaseDate: Date,
        cast: [String],
        posterUrl: String,
        trailerUrl: String,
        ottAssetKey: String,
        ratingAvg: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ["upcoming", "in-theaters", "released"],
            default: "upcoming",
        },
        expiredAt: Date,
    },
    { timestamps: true }
);

// 3️⃣ Create model with proper typing
const Movie = model<IMovie>("Movie", MovieSchema);

export default Movie;
