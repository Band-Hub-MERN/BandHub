package com.garageband.app.models

import java.io.Serializable

data class Venue(
    val id: String,
    val name: String,
    val genre: String,
    val priceRange: String,       // "$", "$$", "$$$"
    val distanceMiles: Double,
    val rating: Float,            // 0.0 - 5.0
    val description: String,
    val imageUrl: String,
    val isFavorite: Boolean = false,
    val upcomingShowCount: Int = 0
) : Serializable
