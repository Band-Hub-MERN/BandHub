package com.garageband.app.models

enum class ShowDateType { UPCOMING, PAST, NONE }

data class ShowDate(
    val day: Int,
    val type: ShowDateType = ShowDateType.NONE
)
