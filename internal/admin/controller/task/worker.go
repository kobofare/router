package task

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/yeying-community/router/common/helper"
	"github.com/yeying-community/router/common/logger"
	channel "github.com/yeying-community/router/internal/admin/controller/channel"
	"github.com/yeying-community/router/internal/admin/model"
)

const (
	asyncTaskWorkerCount   = 2
	asyncTaskPollInterval  = 1200 * time.Millisecond
)

var startAsyncTaskWorkersOnce sync.Once

func StartAsyncTaskWorkers() {
	startAsyncTaskWorkersOnce.Do(func() {
		for idx := 0; idx < asyncTaskWorkerCount; idx++ {
			go asyncTaskWorkerLoop(idx + 1)
		}
	})
}

func asyncTaskWorkerLoop(workerIndex int) {
	for {
		taskRow, err := model.ClaimNextPendingAsyncTaskWithDB(model.DB)
		if err != nil {
			logger.Warn(context.Background(), fmt.Sprintf("[async-task] worker=%d claim_failed error=%q", workerIndex, err.Error()))
			time.Sleep(asyncTaskPollInterval)
			continue
		}
		if taskRow == nil {
			time.Sleep(asyncTaskPollInterval)
			continue
		}
		ctx := context.Background()
		if traceID := strings.TrimSpace(taskRow.TraceID); traceID != "" {
			ctx = helper.SetTraceID(ctx, traceID)
		}
		logger.Info(ctx, fmt.Sprintf("[async-task] worker=%d task_id=%s type=%s status=running", workerIndex, taskRow.Id, taskRow.Type))
		result, execErr := channel.ExecuteAsyncTask(taskRow)
		finalStatus := model.AsyncTaskStatusSucceeded
		errorMessage := ""
		if execErr != nil {
			finalStatus = model.AsyncTaskStatusFailed
			errorMessage = execErr.Error()
		}
		finishErr := model.FinishAsyncTaskWithDB(model.DB, taskRow.Id, finalStatus, result, errorMessage)
		if finishErr != nil {
			logger.Warn(ctx, fmt.Sprintf("[async-task] worker=%d task_id=%s finish_failed error=%q", workerIndex, taskRow.Id, finishErr.Error()))
			time.Sleep(asyncTaskPollInterval)
			continue
		}
		if execErr != nil {
			logger.Warn(ctx, fmt.Sprintf("[async-task] worker=%d task_id=%s type=%s status=failed error=%q", workerIndex, taskRow.Id, taskRow.Type, execErr.Error()))
		} else {
			logger.Info(ctx, fmt.Sprintf("[async-task] worker=%d task_id=%s type=%s status=succeeded", workerIndex, taskRow.Id, taskRow.Type))
		}
	}
}
