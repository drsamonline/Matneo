#!/usr/bin/env python3
"""Superseded - the refresh logic now lives in ONE place.

    drsamonline/app-builder -> drsoam.py

so the exclusion list (meta repos, kits) cannot drift between outputs. The
workflow checks out app-builder and runs `python3 .drsoam/drsoam.py <mode>`
instead of this file. Kept only to explain the move.
"""
