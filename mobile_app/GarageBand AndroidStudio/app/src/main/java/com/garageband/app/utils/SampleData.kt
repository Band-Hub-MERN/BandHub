package com.garageband.app.utils

import com.garageband.app.models.Artist
import com.garageband.app.models.Ticket
import com.garageband.app.models.Venue
import java.util.Calendar
import java.util.Date

object SampleData {

    // TODO: Replace with API calls to your MERN backend
    val artists: List<Artist> = listOf(
        Artist(
            id = "1",
            name = "Metallica",
            genre = "Heavy Metal",
            description = "One of the most commercially successful bands of all time.",
            imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Metallica_at_The_O2_Arena_London_2008.jpg/1200px-Metallica_at_The_O2_Arena_London_2008.jpg",
            isFollowed = true,
            upcomingShowCount = 3
        ),
        Artist(
            id = "2",
            name = "Red Hot Chili Peppers",
            genre = "Alternative Rock",
            description = "Funk rock legends from Los Angeles.",
            imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Red_Hot_Chili_Peppers_-_Rock_in_Rio_2017_-_Foto_Sergio_Savarese_%2815%29.jpg/1200px-Red_Hot_Chili_Peppers_-_Rock_in_Rio_2017_-_Foto_Sergio_Savarese_%2815%29.jpg",
            isFollowed = true,
            upcomingShowCount = 1
        ),
        Artist(
            id = "3",
            name = "AC/DC",
            genre = "Hard Rock",
            description = "Australian rock legends with electrifying performances.",
            imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/AC-DC_-_18-07-2009_-_Ullevi_%28stad%29_-_Gothenburg.jpg/1200px-AC-DC_-_18-07-2009_-_Ullevi_%28stad%29_-_Gothenburg.jpg",
            isFollowed = true,
            upcomingShowCount = 2
        ),
        Artist(
            id = "4",
            name = "Pink Floyd",
            genre = "Progressive Rock",
            description = "Pioneers of psychedelic and art rock.",
            imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/PinkFloydUSA78.jpg/1200px-PinkFloydUSA78.jpg",
            isFollowed = false,
            upcomingShowCount = 5
        ),
        Artist(
            id = "5",
            name = "Foo Fighters",
            genre = "Alternative Rock",
            description = "Rock powerhouse led by Dave Grohl.",
            imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Foo_Fighters_Live_at_Download_2015.jpg/1200px-Foo_Fighters_Live_at_Download_2015.jpg",
            isFollowed = false,
            upcomingShowCount = 4
        )
    )

    val venues: List<Venue> = listOf(
        Venue(
            id = "v1",
            name = "Venue 1",
            genre = "Rock",
            priceRange = "$",
            distanceMiles = 1.2,
            rating = 4.5f,
            description = "Supporting line text lorem ipsum...",
            imageUrl = "",
            isFavorite = false,
            upcomingShowCount = 5
        ),
        Venue(
            id = "v2",
            name = "Venue 2",
            genre = "Multi-genre",
            priceRange = "$$",
            distanceMiles = 2.6,
            rating = 4.0f,
            description = "Supporting line text lorem ipsum...",
            imageUrl = "",
            isFavorite = true,
            upcomingShowCount = 3
        ),
        Venue(
            id = "v3",
            name = "Venue 3",
            genre = "Jazz / Rock",
            priceRange = "$$$",
            distanceMiles = 4.5,
            rating = 3.5f,
            description = "Supporting line text lorem ipsum...",
            imageUrl = "",
            isFavorite = false,
            upcomingShowCount = 8
        ),
        Venue(
            id = "v4",
            name = "The Roxy",
            genre = "Rock / Metal",
            priceRange = "$$",
            distanceMiles = 6.1,
            rating = 4.8f,
            description = "Iconic venue with great acoustics and atmosphere.",
            imageUrl = "",
            isFavorite = true,
            upcomingShowCount = 12
        )
    )

    fun getUpcomingTickets(): List<Ticket> {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_MONTH, 5)
        val date1 = cal.time
        cal.add(Calendar.DAY_OF_MONTH, 12)
        val date2 = cal.time

        return listOf(
            Ticket(
                id = "t1",
                showId = "s1",
                artistName = "Red Hot Chili Peppers",
                showName = "World Tour 2024",
                venueName = "Venue 1",
                showDate = date1,
                showTime = "8:00 PM",
                imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Red_Hot_Chili_Peppers_-_Rock_in_Rio_2017_-_Foto_Sergio_Savarese_%2815%29.jpg/1200px-Red_Hot_Chili_Peppers_-_Rock_in_Rio_2017_-_Foto_Sergio_Savarese_%2815%29.jpg",
                seatInfo = "Section A, Row 5, Seat 12",
                price = 89.99,
                isPast = false
            ),
            Ticket(
                id = "t2",
                showId = "s2",
                artistName = "Metallica",
                showName = "M72 World Tour",
                venueName = "Venue 2",
                showDate = date2,
                showTime = "7:30 PM",
                imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Metallica_at_The_O2_Arena_London_2008.jpg/1200px-Metallica_at_The_O2_Arena_London_2008.jpg",
                seatInfo = "General Admission",
                price = 125.00,
                isPast = false
            )
        )
    }

    fun getPastTickets(): List<Ticket> {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_MONTH, -10)
        val date1 = cal.time
        cal.add(Calendar.DAY_OF_MONTH, -20)
        val date2 = cal.time

        return listOf(
            Ticket(
                id = "t3",
                showId = "s3",
                artistName = "AC/DC",
                showName = "Power Up Tour",
                venueName = "The Roxy",
                showDate = date1,
                showTime = "9:00 PM",
                imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/AC-DC_-_18-07-2009_-_Ullevi_%28stad%29_-_Gothenburg.jpg/1200px-AC-DC_-_18-07-2009_-_Ullevi_%28stad%29_-_Gothenburg.jpg",
                seatInfo = "Section B, Row 3, Seat 7",
                price = 75.00,
                isPast = true
            ),
            Ticket(
                id = "t4",
                showId = "s4",
                artistName = "Pink Floyd",
                showName = "The Wall – Live",
                venueName = "Venue 3",
                showDate = date2,
                showTime = "8:30 PM",
                imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/PinkFloydUSA78.jpg/1200px-PinkFloydUSA78.jpg",
                seatInfo = "VIP Section",
                price = 200.00,
                isPast = true
            )
        )
    }

    // Upcoming show day-of-month values for calendar highlighting (current month)
    val upcomingShowDays: Set<Int> = setOf(5, 11, 18, 22)
    val pastShowDays: Set<Int> = setOf(1, 8, 14)
}
