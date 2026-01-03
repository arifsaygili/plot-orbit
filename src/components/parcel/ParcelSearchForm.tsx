"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Stack,
  Select,
  NumberInput,
  Button,
  Group,
  Text,
  Alert,
  Paper,
  Loader,
} from "@mantine/core";
import { IconMapPin, IconAlertCircle, IconSearch } from "@tabler/icons-react";
import {
  getIlList,
  getIlceList,
  getMahalleList,
  queryParcel,
  type AdminItem,
  type ParcelResult,
} from "@/client/api/parcelClient";

interface ParcelSearchFormProps {
  onParcelFound: (parcel: ParcelResult) => void;
  onSearchStart?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function ParcelSearchForm({
  onParcelFound,
  onSearchStart,
  onError,
  disabled = false,
}: ParcelSearchFormProps) {
  // Dropdown data
  const [ilList, setIlList] = useState<AdminItem[]>([]);
  const [ilceList, setIlceList] = useState<AdminItem[]>([]);
  const [mahalleList, setMahalleList] = useState<AdminItem[]>([]);

  // Selected values
  const [selectedIl, setSelectedIl] = useState<string | null>(null);
  const [selectedIlce, setSelectedIlce] = useState<string | null>(null);
  const [selectedMahalle, setSelectedMahalle] = useState<string | null>(null);
  const [ada, setAda] = useState<number | string>("");
  const [parsel, setParsel] = useState<number | string>("");

  // Loading states
  const [loadingIl, setLoadingIl] = useState(false);
  const [loadingIlce, setLoadingIlce] = useState(false);
  const [loadingMahalle, setLoadingMahalle] = useState(false);
  const [searching, setSearching] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Load provinces on mount
  useEffect(() => {
    async function loadProvinces() {
      setLoadingIl(true);
      try {
        const items = await getIlList();
        setIlList(items);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load provinces";
        setError(msg);
        onError?.(msg);
      } finally {
        setLoadingIl(false);
      }
    }
    loadProvinces();
  }, [onError]);

  // Load districts when province changes
  useEffect(() => {
    if (!selectedIl) {
      setIlceList([]);
      setSelectedIlce(null);
      return;
    }

    async function loadDistricts() {
      setLoadingIlce(true);
      setIlceList([]);
      setSelectedIlce(null);
      setMahalleList([]);
      setSelectedMahalle(null);
      try {
        const items = await getIlceList(selectedIl!);
        setIlceList(items);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load districts";
        setError(msg);
        onError?.(msg);
      } finally {
        setLoadingIlce(false);
      }
    }
    loadDistricts();
  }, [selectedIl, onError]);

  // Load neighborhoods when district changes
  useEffect(() => {
    if (!selectedIlce) {
      setMahalleList([]);
      setSelectedMahalle(null);
      return;
    }

    async function loadNeighborhoods() {
      setLoadingMahalle(true);
      setMahalleList([]);
      setSelectedMahalle(null);
      try {
        const items = await getMahalleList(selectedIlce!);
        setMahalleList(items);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load neighborhoods";
        setError(msg);
        onError?.(msg);
      } finally {
        setLoadingMahalle(false);
      }
    }
    loadNeighborhoods();
  }, [selectedIlce, onError]);

  // Form validation
  const isFormValid =
    selectedMahalle !== null &&
    ada !== "" &&
    Number(ada) > 0 &&
    parsel !== "" &&
    Number(parsel) > 0;

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!isFormValid || !selectedMahalle) return;

    setSearching(true);
    setError(null);
    onSearchStart?.();

    try {
      const result = await queryParcel({
        mahalleId: selectedMahalle,
        ada: String(ada),
        parsel: String(parsel),
      });
      
      // Get selected names from lists
      const selectedIlName = ilList.find(i => i.id === selectedIl)?.name;
      const selectedIlceName = ilceList.find(i => i.id === selectedIlce)?.name;
      const selectedMahalleName = mahalleList.find(i => i.id === selectedMahalle)?.name;
      
      // Merge with result - use form values if API didn't return them
      const enrichedResult = {
        ...result,
        il: result.il || selectedIlName || "",
        ilce: result.ilce || selectedIlceName || "",
        mahalle: result.mahalle || selectedMahalleName || "",
      };
      
      onParcelFound(enrichedResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to query parcel";
      setError(msg);
      onError?.(msg);
    } finally {
      setSearching(false);
    }
  }, [isFormValid, selectedMahalle, selectedIl, selectedIlce, ilList, ilceList, mahalleList, ada, parsel, onParcelFound, onSearchStart, onError]);

  // Clear error when form changes
  useEffect(() => {
    setError(null);
  }, [selectedIl, selectedIlce, selectedMahalle, ada, parsel]);

  return (
    <Paper shadow="sm" radius="md" p="lg" withBorder>
      <Stack gap="md">
        <Group gap="xs">
          <IconMapPin size={20} />
          <Text fw={600} size="lg">
            Find Parcel
          </Text>
        </Group>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            variant="light"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Select
          label="Province (İl)"
          placeholder="Select province"
          data={ilList.map((item) => ({ value: item.id, label: item.name }))}
          value={selectedIl}
          onChange={setSelectedIl}
          searchable
          clearable
          disabled={disabled || loadingIl}
          rightSection={loadingIl ? <Loader size="xs" /> : undefined}
        />

        <Select
          label="District (İlçe)"
          placeholder={selectedIl ? "Select district" : "Select province first"}
          data={ilceList.map((item) => ({ value: item.id, label: item.name }))}
          value={selectedIlce}
          onChange={setSelectedIlce}
          searchable
          clearable
          disabled={disabled || !selectedIl || loadingIlce}
          rightSection={loadingIlce ? <Loader size="xs" /> : undefined}
        />

        <Select
          label="Neighborhood (Mahalle)"
          placeholder={selectedIlce ? "Select neighborhood" : "Select district first"}
          data={mahalleList.map((item) => ({ value: item.id, label: item.name }))}
          value={selectedMahalle}
          onChange={setSelectedMahalle}
          searchable
          clearable
          disabled={disabled || !selectedIlce || loadingMahalle}
          rightSection={loadingMahalle ? <Loader size="xs" /> : undefined}
        />

        <Group grow>
          <NumberInput
            label="Block (Ada)"
            placeholder="e.g. 101"
            value={ada}
            onChange={setAda}
            min={1}
            disabled={disabled}
            allowNegative={false}
            allowDecimal={false}
          />

          <NumberInput
            label="Lot (Parsel)"
            placeholder="e.g. 5"
            value={parsel}
            onChange={setParsel}
            min={1}
            disabled={disabled}
            allowNegative={false}
            allowDecimal={false}
          />
        </Group>

        <Button
          leftSection={searching ? <Loader size="xs" color="white" /> : <IconSearch size={18} />}
          onClick={handleSearch}
          disabled={disabled || !isFormValid || searching}
          fullWidth
          mt="sm"
        >
          {searching ? "Searching..." : "Show on Map"}
        </Button>
      </Stack>
    </Paper>
  );
}
