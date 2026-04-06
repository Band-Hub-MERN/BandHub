package com.garageband.app.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.garageband.app.R
import com.garageband.app.databinding.FragmentSettingsBinding

class SettingsFragment : Fragment() {

    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Set row labels via the included layout's own binding
        binding.rowUsername.tvRowLabel.text = "Username"
        binding.rowEmail.tvRowLabel.text = "Email"
        binding.rowNotifications.tvRowLabel.text = "Notifications"
        binding.rowLocationServices.tvRowLabel.text = "Location Services"
        binding.rowPreferences.tvRowLabel.text = "Preferences"
        binding.rowHelp.tvRowLabel.text = "Help"
        binding.rowSignOut.tvRowLabel.text = "Sign Out"
        binding.rowSignOut.tvRowLabel.setTextColor(
            resources.getColor(R.color.colorError, null)
        )

        binding.rowUsername.root.setOnClickListener {
            Toast.makeText(requireContext(), "Edit Username", Toast.LENGTH_SHORT).show()
        }
        binding.rowEmail.root.setOnClickListener {
            Toast.makeText(requireContext(), "Edit Email", Toast.LENGTH_SHORT).show()
        }
        binding.rowNotifications.root.setOnClickListener {
            Toast.makeText(requireContext(), "Notification Settings", Toast.LENGTH_SHORT).show()
        }
        binding.rowLocationServices.root.setOnClickListener {
            Toast.makeText(requireContext(), "Location Services", Toast.LENGTH_SHORT).show()
        }
        binding.rowPreferences.root.setOnClickListener {
            Toast.makeText(requireContext(), "Preferences", Toast.LENGTH_SHORT).show()
        }
        binding.rowHelp.root.setOnClickListener {
            Toast.makeText(requireContext(), "Help & Support", Toast.LENGTH_SHORT).show()
        }
        binding.rowSignOut.root.setOnClickListener { showSignOutDialog() }
    }

    private fun showSignOutDialog() {
        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("Sign Out")
            .setMessage("Are you sure you want to sign out?")
            .setPositiveButton("Sign Out") { _, _ ->
                Toast.makeText(requireContext(), "Signed out", Toast.LENGTH_SHORT).show()
                // TODO: Clear session token & navigate to LoginActivity
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
