package com.garageband.app.models

import java.io.Serializable
import java.util.Date

data class Show(
    val id: String,
    val artistId: String,
    val artistName: String,
    val venueName: String,
    val venueId: String,
    val date: Date,
    val time: String,
    val imageUrl: String,
    val isFavorite: Boolean = false
) : Serializable
