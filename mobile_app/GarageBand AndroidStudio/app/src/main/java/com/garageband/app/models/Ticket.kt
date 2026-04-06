package com.garageband.app.models

import java.io.Serializable
import java.util.Date

data class Ticket(
    val id: String,
    val showId: String,
    val artistName: String,
    val showName: String,
    val venueName: String,
    val showDate: Date,
    val showTime: String,
    val imageUrl: String,
    val seatInfo: String = "",
    val price: Double = 0.0,
    val qrCode: String = "",
    val isPast: Boolean = false
) : Serializable
