package com.garageband.app.models

import java.io.Serializable

data class Artist(
    val id: String,
    val name: String,
    val genre: String,
    val description: String,
    val imageUrl: String,
    val isFollowed: Boolean = false,
    val upcomingShowCount: Int = 0
) : Serializable
