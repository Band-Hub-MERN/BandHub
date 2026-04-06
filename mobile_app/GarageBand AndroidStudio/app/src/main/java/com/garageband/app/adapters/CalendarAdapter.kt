package com.garageband.app.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.garageband.app.R
import com.garageband.app.databinding.ItemCalendarDayBinding
import com.garageband.app.models.ShowDate
import com.garageband.app.models.ShowDateType

class CalendarAdapter(
    private val days: List<ShowDate?>,   // null = empty cell (padding before day 1)
    private val today: Int,
    private val onDayClick: (Int) -> Unit
) : RecyclerView.Adapter<CalendarAdapter.DayViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DayViewHolder {
        val binding = ItemCalendarDayBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return DayViewHolder(binding)
    }

    override fun onBindViewHolder(holder: DayViewHolder, position: Int) {
        holder.bind(days[position])
    }

    override fun getItemCount() = days.size

    inner class DayViewHolder(
        private val binding: ItemCalendarDayBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(showDate: ShowDate?) {
            if (showDate == null) {
                binding.tvDay.text = ""
                binding.root.isClickable = false
                return
            }

            binding.tvDay.text = showDate.day.toString()
            binding.root.isClickable = true

            val ctx = binding.root.context

            when {
                showDate.day == today -> {
                    // Today — purple circle background
                    binding.root.setBackgroundResource(R.drawable.bg_calendar_today)
                    binding.tvDay.setTextColor(Color.WHITE)
                }
                showDate.type == ShowDateType.UPCOMING -> {
                    // Upcoming show — accent color fill
                    binding.root.setBackgroundResource(R.drawable.bg_calendar_upcoming)
                    binding.tvDay.setTextColor(Color.WHITE)
                }
                showDate.type == ShowDateType.PAST -> {
                    // Past show — muted red fill
                    binding.root.setBackgroundResource(R.drawable.bg_calendar_past)
                    binding.tvDay.setTextColor(Color.WHITE)
                }
                else -> {
                    binding.root.background = null
                    binding.tvDay.setTextColor(ContextCompat.getColor(ctx, R.color.text_primary))
                }
            }

            binding.root.setOnClickListener {
                if (showDate.day > 0) onDayClick(showDate.day)
            }
        }
    }
}
